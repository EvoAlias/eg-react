import { ECS } from './ECS';
import { ChromosomeRenderSystem } from '../systems/ChromosomeRenderSystem';
import { GenomeTreeSystem } from '../systems/GenomeTree';
import HG19 from '../../model/genomes/hg19/hg19';
import { SceneManagerSystem } from '../systems/SceneManagerSystem';

import * as THREE from 'three';
import { CameraSystem, CameraFollowSystem } from '../systems/CameraSystem';
import { ChartSystem } from '../systems/ChartSystem';
import { TwoBitService } from '../services/TwoBitService';
import { GeneService } from '../services/GeneService';
import { GeneRenderSystem } from '../systems/GeneRenderingSystem';
import { GeneConformationService } from '../services/GenomeConformationService';
import { GenomeModelSystem, DebugGenomeModelSystem, SelectedGenomeModelSystem } from '../systems/GenomeModelSystem';
import * as Tween  from '@tweenjs/tween.js';
import { NumericTrackSystem } from '../systems/NumericTrackSystem';
import { Vector3 } from 'three';
import { GenomeModelService } from '../services/GenomeModelService';

export class SceneManager {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer;
    ecs: ECS;

    constructor(public canvas: HTMLCanvasElement) {
        const scene = this.scene = new THREE.Scene();
        const camera = this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 10000);

        camera.position.set(-50, 50, 50);
        camera.lookAt(new Vector3(50, 50, 50));

        const renderer = this.renderer = new THREE.WebGLRenderer({
            canvas,
        });
        // enable standard derivatives for antialiasing
        const gl = renderer.domElement.getContext('webgl') ||
            renderer.domElement.getContext('experimental-webgl');
        gl.getExtension('OES_standard_derivatives');
        renderer.setSize(canvas.width, canvas.height);
        // renderer.setClearColor( 0xffffff );
        this.ecs = new ECS([
            new SceneManagerSystem(this),
            new CameraSystem(),
            new CameraFollowSystem(),
            new GenomeTreeSystem(HG19),
            new GenomeModelSystem(),
            new SelectedGenomeModelSystem(),
            new DebugGenomeModelSystem(),
            new NumericTrackSystem(),
            // new GeneRenderSystem(),
            // new ChromosomeRenderSystem(),
            // new ChartSystem(),
        ],
            [
                new TwoBitService(HG19.twoBitURL),
                // remember to include the forward slash at the end.
                new GeneService('/'), // 'http://ec2-54-89-252-92.compute-1.amazonaws.com/'),
                new GeneConformationService(),
                new GenomeModelService(),
            ]
        );

        this.resizeCanvas();
        this.render();
    }

    render() {
        const r = () => {
            Tween.update();            
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(r);
        }
        requestAnimationFrame(r);
    }

    private resizeCanvas() {
        this.renderer.setSize(this.canvas.width, this.canvas.height);
    }
}