import * as THREE from 'three';
import { System } from "../models/System";
import { SceneManagerSystem } from "./SceneManagerSystem";
import { fromEvent, Observable } from "rxjs";
import { Entity } from "../models/Entity";
import { concatMap, takeUntil, map, first, filter, tap } from "rxjs/operators";
import { CameraSystem } from './CameraSystem';
import { SelectedComponent } from '../components/SelectedComponent';

export class SelectionSystem extends System {
    sM: SceneManagerSystem;
    cS: CameraSystem;

    raycaster = new THREE.Raycaster();

    mouseDowns: Observable<MouseEvent>;
    mouseUps: Observable<MouseEvent>;
    mouseMoves: Observable<MouseEvent>;

    selectedEntities: Entity[] = [];

    keyDown(key: string): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keydown').pipe(
            filter(e => e.key === key)
        )
    }


    keyUp(key: string): Observable<KeyboardEvent> {
        return fromEvent<KeyboardEvent>(window, 'keyup').pipe(
            filter(e => e.key === key)
        )
    }

    test(e: Entity) {
        return true;
    }

    getNormalizedScreenCoords(x: number, y: number) {
        const i = (x / this.sM.sm.canvas.width) * 2 - 1;
        const j = - (y / this.sM.sm.canvas.height) * 2 + 1;
        return [i, j];
    }

    getObservables() {
        this.mouseDowns = fromEvent<MouseEvent>(this.sM.sm.renderer.domElement, 'mousedown');
        this.mouseMoves = fromEvent<MouseEvent>(this.sM.sm.renderer.domElement, 'mousemove');
        this.mouseUps = fromEvent<MouseEvent>(this.sM.sm.renderer.domElement, 'mouseup');
    }

    getIntersections(event: MouseEvent): THREE.Intersection[] {
        const mouse = new THREE.Vector2();
        const renderer = this.sM.sm.renderer;
        const canvas = renderer.domElement;

        // mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.width ) * 2 - 1;
        // mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.height ) * 2 + 1;
        mouse.x = (event.offsetX / canvas.width) * 2 - 1;
        mouse.y = - (event.offsetY / canvas.height) * 2 + 1;
        // console.log('params', mouse, canvas, event);
        this.raycaster.setFromCamera(mouse, this.sM.sm.camera);

        const intersects = this.raycaster.intersectObjects(this.sM.sm.scene.children, true);
        return intersects
    }

    getEntities(event: MouseEvent): Entity[] {
        const intersects = this.getIntersections(event);

        const currentSelected: Entity[] = [];

        for (const intersect of intersects) {
            let current = intersect.object;
            do {
                const entity = this.sM.objectToEntity.get(current.uuid);
                if (entity) {
                    currentSelected.push(entity);
                }
            } while (current = current.parent)
        }

        return currentSelected;
    }

    extentToVec(extent: number[]) {
        const start = this.getNormalizedScreenCoords(extent[0], extent[1]);
        const end = this.getNormalizedScreenCoords(extent[2], extent[3]);

        return [start, end].map(coord => new THREE.Vector2(...coord));
    }

    selectEntities(entities: Entity[]) {
        this.selectedEntities.forEach((e) => e.removeComponent(SelectedComponent));
        entities.forEach(e => e.addComponent(new SelectedComponent()));
        this.selectedEntities = entities;
    }

    setupMouseSelect() {
        this.mouseDowns.subscribe((event) => {
            const currentSelected = this.getEntities(event);
            console.log('down', event, currentSelected, this.selectedEntities)
            this.selectEntities(currentSelected);
        });  
    }

    setupBoxSelect() {
        const drags =
            this.keyDown('Shift').pipe(
                concatMap(() => {
                    return this.mouseDowns.pipe(
                        concatMap(start => this.mouseMoves.pipe(
                            takeUntil(this.mouseUps),
                            map(end => [start.offsetX, start.offsetY, end.offsetX, end.offsetY])
                        ))
                    );
                }),
                takeUntil(this.keyUp('Shift'))
            )
        const done =
            this.keyDown('Shift').pipe(
                concatMap(() => {
                    return this.mouseDowns.pipe(
                        concatMap(start => this.mouseUps.pipe(
                            first(),
                            map(end => [start.offsetX, start.offsetY, end.offsetX, end.offsetY])
                        ))
                    )
                }),
                takeUntil(this.keyUp('Shift'))
            );

        // create a plane
        const geometry = new THREE.PlaneGeometry(0, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);


        drags.subscribe((extent) => {
            this.cS.controls.enableRotate = false;
            const screen = this.extentToVec(extent);
            const world = screen
                .map(v => new THREE.Vector3(v.x, v.y, 0))
                .map(v => v.unproject(this.sM.sm.hudCamera));

            const width = world[1].x - world[0].x;
            const height = world[1].y - world[0].y;
            const geometry = new THREE.PlaneGeometry(width, height);
            plane.geometry = geometry;
            plane.position.copy(world[0].clone().lerp(world[1], 0.5));
            this.sM.sm.hudScene.add(plane);
            console.log('drag')
        },
            () => { },
            () => {
                this.sM.sm.hudScene.remove(plane);

            }
        );

        done.subscribe((finalExtent) => {
            this.cS.controls.enableRotate = true;
            const screen = this.extentToVec(finalExtent);

            const entities = this.entitiesSubject.getValue();
            // in range
            const inRange = entities.filter((e) => {
                const screenPos = e.gameObject.transform.position.clone().project(this.sM.sm.camera);
                // console.log(screenPos, screen);
                const [x, y] = [screenPos.x, screenPos.y];
                const [sx0, sy0, sx1, sy1] = [screen[0].x, screen[0].y, screen[1].x, screen[1].y];
                // flip y because screen coords
                return x > sx0 && x <= sx1 && y <= sy0 && y > sy1;
            })

            this.selectEntities(inRange);
            
            console.log('done', screen, inRange);
            this.sM.sm.hudScene.remove(plane);
        },
            () => { },
            // after box select we have to re set it up
            () => {
                this.sM.sm.hudScene.remove(plane);
                this.setupBoxSelect()
            }

        )
    }

    onECSInit() {
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.cS = this.ecs.getSystem(CameraSystem);
        this.getObservables();
        this.setupBoxSelect();
        this.setupMouseSelect();
    }
}