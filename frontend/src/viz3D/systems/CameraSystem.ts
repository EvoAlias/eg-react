import * as THREE from 'three';
import { System } from '../models/System';
import { SceneManagerSystem } from './SceneManagerSystem';
import * as OBCPlugin from 'three-orbit-controls';
import { Entity } from '../models/Entity';
import * as TWEEN from '@tweenjs/tween.js';
import { Component } from '../models/Component';
import { lerp } from '../lib/lerp';
import { SelectedComponent } from '../components/SelectedComponent';

const OrbitControls = OBCPlugin(THREE);

export class CameraSystem extends System {

    sm: SceneManagerSystem;
    lastSelected: Entity;
    controls: any;

    cameraTween: TWEEN.Tween;

    setTarget(e: Entity) {
        if (this.lastSelected) {
            this.lastSelected.removeComponent(SelectedComponent);
        }
        this.lastSelected = e;
        this.lastSelected.addComponent(new SelectedComponent());
    }

    repositionCamera(wantedPosition: THREE.Vector3, wantedQuaternion: THREE.Quaternion, target: THREE.Vector3) {
        if (this.cameraTween) {
            this.cameraTween.stop();
        }

        const camera = this.sm.sm.camera;
        const startingPostion = camera.position.clone();
        const startingQuaternion = camera.quaternion.clone();
        const startingLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

        const cloneCamera = camera.clone();
        cloneCamera.lookAt(target);
        const endingLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(cloneCamera.quaternion);

        this.controls.enabled = false;
        const moveTween = new TWEEN.Tween(camera.position)
            .to(wantedPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate((d) => {
                const t = (d.x - startingPostion.x) / (wantedPosition.x - startingPostion.x);
                THREE.Quaternion.slerp(startingQuaternion, wantedQuaternion, camera.quaternion, t);

            });

        const lookAtTween = new TWEEN.Tween(startingLookAt)
            .to(endingLookAt, 1000)
            .onUpdate((d) => {
                camera.lookAt(d);
            })
            .onComplete(() => {
                this.controls.enabled = true;
                this.controls.target = target;
                this.controls.update();
                this.cameraTween = null;
            })

        this.cameraTween = moveTween;
        moveTween.chain(lookAtTween);
        moveTween.start();
    }

    onECSInit() {
        this.sm = this.ecs.getSystem(SceneManagerSystem);
        
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
    distance = 1;
    height = 1;

    heightDamping = 2;
    rotationDamping = 3;

    tween: TWEEN.Tween;

    test(e: Entity) {
        return e.hasComponent(SelectedComponent)
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