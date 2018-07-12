import * as THREE from 'three';
import { System } from '../models/System';
import { SceneManagerSystem } from './SceneManagerSystem';
import * as OBCPlugin from 'three-orbit-controls';
import { Entity } from '../models/Entity';
import * as TWEEN from '@tweenjs/tween.js';
import { Component } from '../models/Component';
import { lerp } from '../lib/lerp';

const OrbitControls = OBCPlugin(THREE);

export class SelectedComponent implements Component {
    readonly name = SelectedComponent.name;
}

export class CameraSystem extends System {

    sm: SceneManagerSystem;
    lastSelected: Entity;
    raycaster = new THREE.Raycaster();
    controls: any;

    getIntersections(event: MouseEvent): THREE.Intersection[] {
        const mouse = new THREE.Vector2();
        const renderer = this.sm.sm.renderer;
        const canvas = renderer.domElement;

        // mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.width ) * 2 - 1;
        // mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.height ) * 2 + 1;
        mouse.x = (event.offsetX / canvas.width) * 2 - 1;
        mouse.y = - (event.offsetY / canvas.height) * 2 + 1;
        // console.log('params', mouse, canvas, event);
        this.raycaster.setFromCamera(mouse, this.sm.sm.camera);

        const intersects = this.raycaster.intersectObjects(this.sm.sm.scene.children, true);
        return intersects
    }

    getEntities(event: MouseEvent): Entity[] {
        const intersects = this.getIntersections(event);

        const currentSelected: Entity[] = [];

        for (const intersect of intersects) {
            let current = intersect.object;
            do {
                const entity = this.sm.objectToEntity.get(current.uuid);
                if (entity) {
                    currentSelected.push(entity);
                }
            } while (current = current.parent)
        }

        return currentSelected;
    }

    setupMouseEvents() {
        const mouse = new THREE.Vector2();
        const renderer = this.sm.sm.renderer;
        const canvas = renderer.domElement;
        const onMouse = (event: MouseEvent) => {
            const currentSelected = this.getEntities(event);
            if (this.lastSelected && currentSelected.indexOf(this.lastSelected) === -1) {
                this.lastSelected.removeComponent(SelectedComponent);
                this.lastSelected = null;
            }
            if (currentSelected.length > 0) {
                this.setTarget(currentSelected[0]);
            }
        }
        canvas.addEventListener('click', onMouse);
    }

    setTarget(e: Entity) {
        if (this.lastSelected) {
            this.lastSelected.removeComponent(SelectedComponent);
        }
        this.lastSelected = e;
        this.lastSelected.addComponent(new SelectedComponent());
    }

    onECSInit() {
        this.sm = this.ecs.getSystem(SceneManagerSystem);
        this.setupMouseEvents();

        const camera = this.sm.sm.camera;
        const renderer = this.sm.sm.renderer;
        const controls = this.controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.minPolarAngle = 0.8;
        controls.maxPolarAngle = 2.4;
        controls.dampingFactor = 0.07;
        controls.rotateSpeed = 0.07;
        controls.update();
    }
}

export class CameraFollowSystem extends System {
    cs: CameraSystem;
    sm: SceneManagerSystem;

    target: THREE.Object3D;
    distance = 10;
    height = 5;

    heightDamping = 2;
    rotationDamping = 3;

    tween: TWEEN.Tween;

    test(e: Entity) {
        return e.hasComponent(SelectedComponent)
    }


    setupFollow() {
        // deprecated
        // let time = performance.now();
        // this.ecs.fixedUpdate$.subscribe(() => {
        //     const newTime = performance.now();
        //     const deltaTime = newTime - time;
        //     time = newTime;

        //     if (!this.target) {
        //         return;
        //     }

        //     const camera = this.sm.sm.camera;

        //     const wantedRotationAngle = this.target.rotation.y;
        //     const wantedHeight = this.target.position.y + this.height;

        //     let currentRotationAngle = camera.rotation.y;
        //     let currentHeight = camera.position.y

        //     currentRotationAngle =
        //         lerp(currentRotationAngle, wantedRotationAngle, this.rotationDamping * deltaTime / 1000)
        //     currentHeight = lerp(currentHeight, wantedHeight, this.heightDamping * deltaTime / 1000);

        //     const currentRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, currentRotationAngle, 0));

        //     // Set poistion to some distance behind
        //     camera.position.copy(this.target.position);
        //     const targetForward = new THREE.Vector3().applyQuaternion(currentRotation).multiplyScalar(this.distance);
        //     camera.position.copy(camera.position.sub(targetForward));

        //     camera.position.setY(currentHeight);
        //     camera.lookAt(this.target.position);

        //     this.cs.controls.target = this.target.position;
        //     this.cs.controls.update();
        // })
    }

    setTarget(e: Entity) {
        this.target = e.gameObject.transform;
    }

    onECSInit() {
        this.cs = this.ecs.getSystem(CameraSystem);
        this.sm = this.ecs.getSystem(SceneManagerSystem);

        // this.setupFollow();
    }

    enter(e: Entity) {
        this.target = e.gameObject.transform;
        const camera = this.sm.sm.camera;
        const startingQuaternion = camera.quaternion.clone();

        const wantedPosition = this.target.position.clone().sub(
            (new THREE.Vector3(this.distance, 0, 0)).applyQuaternion(this.target.quaternion)
        )

        const copyCamera = camera.clone();
        copyCamera.position.copy(wantedPosition);
        copyCamera.lookAt(this.target.position);
        copyCamera.up.copy((new THREE.Vector3(0, 1, 0)).applyQuaternion(this.target.quaternion));
        const wantedQuaternion = copyCamera.quaternion.clone();
        const wantedUp = copyCamera.up.clone();

        const startingPos = camera.position.clone();
        const tween = new TWEEN.Tween(camera.position)
            .to(wantedPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate((d) => {
                const t = (d.x - startingPos.x) / (wantedPosition.x - startingPos.x);
                // console.log('update', t);
                THREE.Quaternion.slerp(startingQuaternion, wantedQuaternion, camera.quaternion, t);
                // camera.lookAt(this.target.position);
            })
            .onComplete(() => {
            })

        const upTween = new TWEEN.Tween(camera.up)
            .to(wantedUp, 200)
            .onUpdate(() => {
                this.cs.controls.target = this.target.position;
                this.cs.controls.update();
            })
            .onComplete(() => {
                this.cs.controls.target = this.target.position;
                this.cs.controls.update();
            });

        tween.chain(upTween);

        tween.start();


    }
}