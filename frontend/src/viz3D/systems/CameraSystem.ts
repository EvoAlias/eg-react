import * as THREE from 'three';
import { System } from '../models/System';
import { SceneManagerSystem } from './SceneManagerSystem';
import * as OBCPlugin from 'three-orbit-controls';

const OrbitControls = OBCPlugin(THREE);

export class CameraSystem extends System {

    sm: SceneManagerSystem;

    onECSInit() {
        this.sm = this.ecs.getSystem(SceneManagerSystem);

        const camera = this.sm.sm.camera;
        const renderer = this.sm.sm.renderer;
        const controls = new OrbitControls(camera, renderer.domElement);
    }
}