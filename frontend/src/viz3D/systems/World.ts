import { System } from "../models/System";
import { Entity } from "../models/Entity";
import { GameObject } from "../components/GameObject";

export class World extends System {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer
    constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.Renderer) {
        super();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
    }

    test(entity: Entity) {
        return entity.hasComponent(GameObject);
    }

    static ExampleWorld() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor("#000000");
        renderer.setSize(window.innerWidth, window.innerHeight);
        return new World(scene, camera, renderer);
    }
}