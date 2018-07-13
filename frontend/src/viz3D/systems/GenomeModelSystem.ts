import { System } from "../models/System";
import { SceneManagerSystem } from "./SceneManagerSystem";

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import * as d3 from 'd3';
import { Component } from "../models/Component";
import IntervalTree, { Interval } from "interval-tree2";
import { GenomeTreeSystem } from "./GenomeTree";
import { switchMap, map, debounce, tap } from "rxjs/operators";
import { RangeInterval } from "../models/Range";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import { Entity } from "../models/Entity";
import { IntervalComponent } from "../components/IntervalComponent";
import { CameraFollowSystem, CameraSystem } from "./CameraSystem";
import { ChromosomeModelDetails, GenomeModelService } from "../services/GenomeModelService";
import { from, BehaviorSubject } from "rxjs";
import { async } from "rxjs/internal/scheduler/async";
import { SelectedComponent } from "../components/SelectedComponent";
const STLLoader = require('three-stl-loader')(THREE);

export class GenomeSegment implements Component {
    readonly name = GenomeSegment.name;
    line: THREE.Line;

    debugX: THREE.Line;
    debugY: THREE.Line;
    debugZ: THREE.Line;
    constructor(public positions: THREE.Vector3[]) { }

    getLength() {
        const vertices = (this.line.geometry as THREE.Geometry).vertices;
        return vertices[0].distanceTo(vertices[1]);
    }
}

function selectedMaterial() {
    return new THREE.LineBasicMaterial({
        color: 0xffff00,
        linewidth: 5
    });
}

function deselectedMaterial() {
    return new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 5
    });
}

export type GenomeModelLayout = 'Linear' | 'String' | 'Circular';

export class GenomeModelSystem extends System {
    sM: SceneManagerSystem;
    gTS: GenomeTreeSystem;
    gMS: GenomeModelService;
    cS: CameraSystem;

    lineMaterial: THREE.LineBasicMaterial;
    lineGeometry: THREE.Geometry;
    lineMesh: THREE.Line;

    remeshTween: TWEEN.Tween;

    currentInterval: ChromosomeInterval;
    loadedChromosomes: { [chr: string]: boolean } = {};

    modelLayoutSource = new BehaviorSubject<GenomeModelLayout>('Linear');
    modelLayout$ = this.modelLayoutSource.asObservable();
    get modelLayout() {
        return this.modelLayoutSource.getValue()
    }

    animatingSource = new BehaviorSubject<boolean>(false);
    animating$ = this.animatingSource.asObservable();
    get animating() {
        return this.animatingSource.getValue()
    }

    test(e: Entity) {
        return e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment);
    }

    async reloadView(viewRange: RangeInterval) {
        const interval = this.gTS.viewToChromosomeInterval(viewRange);

        // check if we've loaded this chromosome.
        if (this.loadedChromosomes[interval.chr]) {
            return;
        }
        // we haven't loaded this
        this.loadedChromosomes[interval.chr] = true;
        const details = await this.gMS.loadChromosomeAsync(interval.chr);

        // create entities for every interval in the genome model
        const chromosomeIntervals = details.genomicCoords.map((r) => new ChromosomeInterval(interval.chr, r[0], r[1]))
        const viewIntervals = chromosomeIntervals.map((i) => this.gTS.chromosomeIntervalToView(i));
        const length = viewIntervals.length;
        const entities = viewIntervals.map((range, i) => {
            const first = details.positions[i];
            const last = details.positions[Math.min(i + 1, length - 1)];

            const gs = new GenomeSegment([first, last]);
            const entity = this.gTS.createEntityWithInterval(range, [gs]);
            return entity;
        })
        // entities.forEach(e => this.ecs.addEntity(e));
        this.currentInterval = interval;
    }

    subscribeOnEntityChange() {

        // Whenever the view range changes reload the view
        this.gTS.viewRange$.pipe(
            // rate limit to fixed update
            debounce(() => this.ecs.fixedUpdate$),
            // block until we load entities in view using the GenomeModelService
            switchMap((viewRange) => {
                return from(this.reloadView(viewRange))
            }),
            // It may have been some time since reloadView was called.
            // Refresh observable chain to pay attention to the current entities list
            switchMap(() => {
                return this.entities$
            }),
            // Rate limit to the fixed update
            debounce(() => this.ecs.fixedUpdate$),
        )
            .subscribe((entities) => {
                this.data(entities);
            })

        // Wehenver we change layout systems update the entities.
        this.modelLayout$.pipe(
            // always rate limit to fixed update
            debounce(() => this.ecs.fixedUpdate$)
        ).subscribe(() => {
            // This forces an update cycle to go.
            this.entitiesSubject.next(this.entitiesSubject.getValue());
        })
    }

    data(data: Entity[]) {
        // Use d3 to manage the rendering and update cycle

        // join is to update existing elements
        const join = d3.select(this.sM.sm.renderer.domElement)
            .selectAll('genome-segment-component')
            .data(data as any, (d: Entity) => {
                return `${d.id}`;
                // const ic = d.getComponent(IntervalComponent);
                // return ic.interval.id as any;
            });

        // enterSel is for adding new elements
        const enterSel = join.enter()
            .append('genome-segment-component')

        // merge enter and update
        join
            .merge(enterSel)
            .call((selection) => {
                const startingPos: THREE.Vector3[] = [];
                const endingPos: THREE.Vector3[] = [];

                selection.each((e: Entity) => startingPos.push(e.gameObject.transform.position.clone()));
                selection.each((e: Entity) => this.repositionEntity(e));
                selection.each((e: Entity) => endingPos.push(e.gameObject.transform.position.clone()));

                // setup next
                // let i = 0;
                // selection.each((e: Entity) => {
                //     const start = startingPos[i];
                //     const end = endingPos[Math.min(i + 1, endingPos.length - 1)];
                //     const gs = e.getComponent(GenomeSegment);
                //     const geometry = (gs.line.geometry as THREE.Geometry);
                //     const vertices = geometry.vertices;
                //     vertices[0] = start.clone();
                //     vertices[1] = end.clone();
                //     geometry.verticesNeedUpdate = true;
                //     i += 1;
                // })

                // Set the target for the camera system
                if (data.length > 0) {
                    this.cS.setTarget(data[0]);
                }

                // update the line geometry with the starting positions
                this.lineGeometry.dispose();
                this.lineGeometry = new THREE.Geometry();
                for (const vert of startingPos) {
                    this.lineGeometry.vertices.push(vert);
                }

                // Animate mesh tweening
                if (this.remeshTween) {
                    this.remeshTween.stop();
                }

                this.animatingSource.next(true);

                const remeshTween = new TWEEN.Tween({ t: 0 })
                    .to({ t: 1 }, 1000)
                    .onUpdate(({ t }) => {
                        startingPos.forEach((start, i) => {
                            this.lineGeometry.vertices[i] = start.clone().lerp(endingPos[i], t);
                        });
                        this.lineGeometry.verticesNeedUpdate = true;
                        this.lineGeometry.computeBoundingBox();
                        const center = this.lineGeometry.boundingBox.min.clone().lerp(
                            this.lineGeometry.boundingBox.max, 0.5);
                    })
                    .onComplete(() => {
                        this.remeshTween = null;
                        this.animatingSource.next(false);
                    })

                remeshTween.start();
                this.remeshTween = remeshTween;

                this.lineGeometry.verticesNeedUpdate = true;
                this.lineMesh.geometry = this.lineGeometry;
            })

        const exitSel = join
            .exit()
            .call((selection) => {
                // TODO clean up resources?
            })
            .remove()

        // this.render();
    }

    getWorldPosition(v: THREE.Vector3) {
        // scale along the bounding box. and map 
        const worldScale = this.gTS.worldSize;
        const details = this.gMS.loadChromosome(this.currentInterval.chr);
        return new THREE.Vector3(
            details.x(v.x) * worldScale,
            details.y(v.y) * worldScale,
            details.z(v.z) * worldScale
        );
    }

    repositionEntity(e: Entity) {
        const ic = e.getComponent(IntervalComponent);
        const gs = e.getComponent(GenomeSegment);
        let worldPositions;
        if (this.modelLayout === 'String') {
            worldPositions = gs.positions.map(pos => this.getWorldPosition(pos));
        } else if (this.modelLayout === 'Linear') {
            const viewRange = this.gTS.viewRange;
            const t1 = (ic.interval.start - viewRange[0]) / (viewRange[1] - viewRange[0]);
            const t2 = (ic.interval.end - viewRange[0]) / (viewRange[1] - viewRange[0]);
            
            const worldScale = this.gTS.worldSize;

            worldPositions = [t1, t2].map((t) => new THREE.Vector3(0, 0, t * worldScale));
        } else {
            const worldScale = this.gTS.worldSize;
            const viewRange = this.gTS.viewRange;

            const t1 = (ic.interval.start - viewRange[0]) / (viewRange[1] - viewRange[0]);
            const t2 = (ic.interval.end - viewRange[0]) / (viewRange[1] - viewRange[0]);

            worldPositions = [t1, t2].map((t) => {
                const x = worldScale * Math.cos(2 * Math.PI * t);
                const y = worldScale * Math.sin(2 * Math.PI * t);
                return new THREE.Vector3(x, 0, y);
            });
        }
        // Set the entities +z axis to the world position.

        const start = worldPositions[0];
        const end = worldPositions[1];
        const dir = worldPositions[1].clone().sub(worldPositions[0]);
        // set the transform to be the midpoint
        e.gameObject.transform.position.copy(start.clone());
        e.gameObject.transform.lookAt(worldPositions[1]);

        const geometry = (gs.line.geometry as THREE.Geometry);
        const vertices = geometry.vertices;

        const startPos = new THREE.Vector3(0, 0, 0);
        const endPos = new THREE.Vector3(0, 0, dir.length());

        vertices[0] = startPos;
        vertices[1] = endPos;
        geometry.verticesNeedUpdate = true;
    }

    onECSInit() {
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.cS = this.ecs.getSystem(CameraFollowSystem);
        this.gMS = this.ecs.getService(GenomeModelService);

        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 10
        });
        this.lineGeometry = new THREE.Geometry();
        this.lineMesh = new THREE.Line(this.lineGeometry, this.lineMaterial);
        this.lineMesh.frustumCulled = false;

        this.sM.sm.scene.add(this.lineMesh);

        this.subscribeOnEntityChange();

        let i = 0;
        const layouts: GenomeModelLayout[] = ['Linear', 'Circular', 'String'];

        setInterval(() => {
            this.modelLayoutSource.next(layouts[i % layouts.length]);
            i++;
        }, 10000)

        // let num = 0;
        // setInterval(() => {
        //     const interval = this.gTS.chromosomeIntervals[`chr${1 + (num % 21)}`];
        //     this.gTS.updateViewRange([interval.start, interval.end]);
        //     num += 1;
        // }, 10000)

    }

    enter(e: Entity) {
        // create line element
        const gs = e.getComponent(GenomeSegment);
        const material = deselectedMaterial();
        const geometry = new THREE.Geometry();

        geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1));

        const line = new THREE.Line(geometry, material);
        e.gameObject.transform.add(line);
        gs.line = line;
    }

    exit(e: Entity) {
        // remove line
        const gs = e.getComponent(GenomeSegment);
        e.gameObject.transform.remove(gs.line);
        gs.line.geometry.dispose();
    }


}

export class SelectedGenomeModelSystem extends System {
    gMS: GenomeModelSystem;

    test(e: Entity) {
        return e.hasComponent(SelectedComponent) && e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment);
    }

    onECSInit() {
        this.gMS = this.ecs.getSystem(GenomeModelSystem);
    }

    enter(e: Entity) {
        const gs = e.getComponent(GenomeSegment);
        gs.line.material = selectedMaterial();
        gs.line.material.needsUpdate = true;
    }

    exit(e: Entity) {
        const gs = e.getComponent(GenomeSegment);
        gs.line.material = deselectedMaterial();
        gs.line.material.needsUpdate = true;
    }
}

export class DebugGenomeModelSystem extends System {
    test(e: Entity) {
        return e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment);
    }

    enter(e: Entity) {
        const xAxis = new THREE.Geometry();
        xAxis.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(5, 0, 0),
        );
        const yAxis = new THREE.Geometry();
        yAxis.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 5, 0),
        );
        const zAxis = new THREE.Geometry();
        zAxis.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 5),
        );

        const x = new THREE.Line(xAxis, new THREE.LineBasicMaterial({
            color: 0xff0000
        }))

        const y = new THREE.Line(yAxis, new THREE.LineBasicMaterial({
            color: 0x00ff00
        }))

        const z = new THREE.Line(zAxis, new THREE.LineBasicMaterial({
            color: 0x0000ff
        }))

        const gs = e.getComponent(GenomeSegment);
        gs.debugX = x;
        gs.debugY = y;
        gs.debugZ = z;
        e.gameObject.transform.add(x);
        e.gameObject.transform.add(y);
        e.gameObject.transform.add(z);
    }

    exit(e: Entity) {
        const gs = e.getComponent(GenomeSegment);
        e.gameObject.transform.remove(gs.debugX);
        e.gameObject.transform.remove(gs.debugY);
        e.gameObject.transform.remove(gs.debugZ);
        gs.debugX.geometry.dispose();
        gs.debugY.geometry.dispose();
        gs.debugZ.geometry.dispose();
    }
}