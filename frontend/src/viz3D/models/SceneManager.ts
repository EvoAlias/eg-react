import * as THREE from 'three';
import { ECS } from './ECS';
import { World } from '../systems/World';
import { ChromosomeRenderSystem } from '../systems/ChromosomeRenderSystem';
import { GenomeTreeSystem } from '../systems/GenomeTree';
import HG19 from '../../model/genomes/hg19/hg19';

export class SceneManager {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer;
    ecs: ECS;
    
    constructor(public canvas: HTMLCanvasElement) {
        const scene = this.scene = new THREE.Scene();
        const camera = this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const renderer = this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.ecs = new ECS([
            new GenomeTreeSystem(HG19),
            new ChromosomeRenderSystem()
        ]);

        this.resizeCanvas();
        this.render()
    }

    render() {
        this.ecs.update();
        requestAnimationFrame(() => this.render());
    }


    private resizeCanvas() {
        this.renderer.setSize(this.canvas.width, this.canvas.height);
    }
}