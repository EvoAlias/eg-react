import * as THREE from 'three';

import { System } from "../models/System";
import { SceneManagerSystem } from "./SceneManagerSystem";
import { GenomeModelSystem, GenomeModelLayout } from './GenomeModelSystem';
import { switchMap, map, debounce, filter } from 'rxjs/operators';
import { GenomeTreeSystem } from './GenomeTree';
import { CameraSystem } from './CameraSystem';
import { Observable, fromEvent } from 'rxjs';

const Key = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
}

export class GenomeBrowserSystem extends System {
    sM: SceneManagerSystem;
    cS: CameraSystem;
    gTS: GenomeTreeSystem;
    gMS: GenomeModelSystem;

    keyDown(key: string): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keydown').pipe(
            filter(e => e.key === key)
        )
    }

    keyCodeDown(key: number): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keydown').pipe(
            filter(e => e.keyCode === key)
        )
    }


    keyUp(key: string): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keyup').pipe(
            filter(e => e.key === key)
        )
    }


    keyCodeUp(key: number): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keyup').pipe(
            filter(e => e.keyCode === key)
        )
    }

    setupScene() {
        console.log('set up scene');
        const scene = this.sM.sm.scene;
        const camera = this.sM.sm.camera;
        const grid = new THREE.GridHelper(1000, 1000, 0x888888, 0x888888);
        grid.position.set(0, -1.1, 0);
        scene.add(grid);

        scene.add(new THREE.AmbientLight(0x404040));

        const fogColor = new THREE.Color(0x0000ff);

        scene.fog = new THREE.Fog(0xffffff, 0.0025, 1000);

        const pointLight = new THREE.PointLight(0xffff00);
        pointLight.castShadow = true;
        camera.add(pointLight);

    }

    setupHotKeys() {
        const layouts: GenomeModelLayout[] = ['Linear', 'Circular', 'String'];
        let i = layouts.findIndex(l => l === this.gMS.modelLayout);

        this.keyCodeDown(Key.RIGHT).subscribe(() => {
            i += 1;
            this.gMS.modelLayoutSource.next(layouts[i % layouts.length])
        });

        this.keyCodeDown(Key.LEFT).subscribe(() => {
            i -= 1;
            i = i < 0 ? 2 : i;
            this.gMS.modelLayoutSource.next(layouts[i % layouts.length])
        });

        const chromsomes = Object.keys(this.gTS.chromosomeIntervals);
        const intervals = chromsomes.map(c => this.gTS.chromosomeIntervals[c]);
        let j = 0;
        this.keyCodeDown(Key.UP)
        .pipe(
            debounce(() => this.ecs.fixedUpdate$)
        )
        .subscribe(() => {
            j += 1;
            j = j % intervals.length;
            const interval = intervals[j];
            this.gTS.updateViewRange([interval.start, interval.end])
        });

        this.keyCodeDown(Key.DOWN)
        .pipe(
            debounce(() => this.ecs.fixedUpdate$)
        )
        .subscribe(() => {
            j -= 1;
            j = j < 0 ? intervals.length : j;
            j = j % intervals.length;
            const interval = intervals[j];
            this.gTS.updateViewRange([interval.start, interval.end])
        });
    }

    setupHud() {
        const hudCamera = this.sM.sm.hudCamera;
        const width = 1000;
        const height = 100;

        const hudCanvas = document.createElement('canvas');
        hudCanvas.width = width;
        hudCanvas.height = height;
        const hudBitmap = hudCanvas.getContext('2d');

        hudBitmap.font = "Normal 40px Arial";
        // hudBitmap.fillStyle = "rgba(245,245,245,0.75)";
        hudBitmap.fillText('Initializing...', width / 2, height / 2);

        const hudTexture = new THREE.CanvasTexture(hudCanvas)
        hudTexture.needsUpdate = true;
        const material = new THREE.MeshBasicMaterial({ map: hudTexture });
        material.transparent = true;

        const planeGeometry = new THREE.PlaneGeometry(width, height);
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(-width / 2, -height / 2, 0);
        plane.position.z = this.sM.sm.hudCamera.position.z - 5;
        this.sM.sm.hudScene.add(plane);

        this.gTS.viewRange$.pipe(
            debounce(() => this.ecs.render$)
        ).subscribe((viewRange) => {
            const interval = this.gTS.viewToChromosomeInterval(viewRange);
            hudBitmap.clearRect(0, 0, width, height);
            hudBitmap.fillText(`${interval.chr}: ${interval.start}, ${interval.end}`, width / 2, height / 2);
            hudTexture.needsUpdate = true
        }) 

    }

    watchGenomeModel() {
        // Listen to model layout changes.
        this.gMS.modelLayout$.pipe(
            // Listen to world size changes as well
            switchMap((modelLayout) => {
                return this.gTS.worldSize$.pipe(
                    map((worldSize) => ({ modelLayout, worldSize }))
                )
            }),
            // make sure to rate limit
            debounce(() => this.ecs.fixedUpdate$)
        ).subscribe(({ modelLayout, worldSize }) => {
            console.log('genomemodel changed', modelLayout, worldSize);
            const camera = this.sM.sm.camera;
            const clone = camera.clone();
            if (modelLayout === 'Linear') {
                // Linear fits world size and points down z axis
                const wantedTarget = new THREE.Vector3(0, 0, worldSize / 2);
                const wantedPosition = new THREE.Vector3(worldSize / 2, 10, worldSize / 2);

                clone.position.copy(wantedPosition);
                clone.lookAt(wantedTarget);
                this.cS.repositionCamera(wantedPosition, clone.quaternion, wantedTarget);
            } else if (modelLayout === 'Circular') {
                const wantedTarget = new THREE.Vector3(0, 0, 0);
                const wantedPosition = new THREE.Vector3(0, worldSize, 0);

                clone.position.copy(wantedPosition);
                clone.lookAt(wantedTarget);
                this.cS.repositionCamera(wantedPosition, clone.quaternion, wantedTarget);
            } else {
                const wantedTarget = new THREE.Vector3(worldSize / 2, worldSize / 2, worldSize / 2);
                const wantedPosition = new THREE.Vector3(worldSize + 5, worldSize + 5, worldSize + 5);

                clone.position.copy(wantedPosition);
                clone.lookAt(wantedTarget);
                this.cS.repositionCamera(wantedPosition, clone.quaternion, wantedTarget)
            }
        })
    }

    onECSInit() {
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.gMS = this.ecs.getSystem(GenomeModelSystem);
        this.cS = this.ecs.getSystem(CameraSystem);

        this.setupHotKeys();
        this.setupScene();
        this.setupHud();
        this.watchGenomeModel();
    }
}