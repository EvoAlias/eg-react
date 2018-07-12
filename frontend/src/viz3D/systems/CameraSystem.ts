import * as THREE from 'three';
import { System } from '../models/System';
import { SceneManagerSystem } from './SceneManagerSystem';
import * as OBCPlugin from 'three-orbit-controls';
import { Entity } from '../models/Entity';
import * as TWEEN from '@tweenjs/tween.js';
import { Component } from '../models/Component';

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
                console.log('removing selected', this.lastSelected);
                this.lastSelected = null;
            }
            if (currentSelected.length > 0) {
                if (this.lastSelected) {
                    this.lastSelected.removeComponent(SelectedComponent);
                }
                this.lastSelected = currentSelected[0];
                this.lastSelected.addComponent(new SelectedComponent());
            }
        }
        canvas.addEventListener('click', onMouse);
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

    onECSInit() {
        this.cs = this.ecs.getSystem(CameraSystem);
        this.sm = this.ecs.getSystem(SceneManagerSystem);
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
                // camera.position.copy(wantedPosition);
                // camera.lookAt(this.target.position);
                // camera.up.copy((new THREE.Vector3(0, 1, 0)).applyQuaternion(this.target.quaternion));
                
                
                // const wantedQuaternion = copyCamera.quaternion.clone()
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


        // const euler = target.rotation;

        // const wantedRotationAngle = euler.y;
        // const wantedHeight = target.position.y + height;

        // const currentRotationAngle = camera.rotation.y;
        // const currentHeight = camera.position.y;

        // const currentRotation = target.quaternion;
        // // new THREE.Quaternion().setFromEuler(new THREE.Euler(0, wantedRotationAngle, 0));

        // const zAxis = new THREE.Vector3(0, 0, 1);
        // console.log('axis',
        //     zAxis, 
        // zAxis.clone().applyQuaternion(camera.quaternion), zAxis.clone().applyQuaternion(target.quaternion))

        // // Move camera to where the object is minus distance on the x axis
        // camera.position.copy(target.position);
        // camera.position.sub((new THREE.Vector3(distance, 0, 0)).applyQuaternion(currentRotation));

        // // we should now be looking down the x axis.
        // camera.lookAt(target.position);

        // // we want the camera up axis to be the y axis.
        // camera.up.copy((new THREE.Vector3(0, 1, 0)).applyQuaternion(currentRotation));


        // // camera.setRotationFromQuaternion(currentRotation);
        // console.log(camera, target);
        // // camera.position.copy(new THREE.Vector3(camera.position.x, wantedHeight, camera.position.z));
        // this.cs.controls.target = target.position;
        // this.cs.controls.update();


        // this.cs.controls.target.copy(e.gameObject.transform);
    }
}