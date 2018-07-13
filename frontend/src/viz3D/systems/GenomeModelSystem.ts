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
    worldPositions: THREE.Vector3[];
    length: number;

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
        linewidth: 12
    });
}

function deselectedMaterial() {
    return new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 10
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

    setupDrawRoutine() {
        this.ecs.render$.subscribe(() => {
            this.draw(this);
        });
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
            .attr('x0', e => e.gameObject.transform.position.x)
            .attr('y0', e => e.gameObject.transform.position.y)
            .attr('z0', e => e.gameObject.transform.position.z)
            .attr('x1', e => e.gameObject.transform.position.x)
            .attr('y1', e => e.gameObject.transform.position.y)
            .attr('z1', e => e.gameObject.transform.position.z)
            .attr('length', 0)
            .attr('uuid', e => e.gameObject.transform.uuid)

        // merge enter and update
        join
            .merge(enterSel)
            .call((selection) => {
                selection.each((e: Entity) => {
                    const worldPositions = this.getWorldPositions(e);
                    const gs = e.getComponent(GenomeSegment);
                    gs.worldPositions = worldPositions;
                    gs.length = worldPositions[0].distanceTo(worldPositions[1]);
                });
                console.log('updating', selection);
            })
            .transition()
            .attr('x0', e => e.getComponent(GenomeSegment).worldPositions[0].x)
            .attr('y0', e => e.getComponent(GenomeSegment).worldPositions[0].y)
            .attr('z0', e => e.getComponent(GenomeSegment).worldPositions[0].z)
            .attr('x1', e => e.getComponent(GenomeSegment).worldPositions[1].x)
            .attr('y1', e => e.getComponent(GenomeSegment).worldPositions[1].y)
            .attr('z1', e => e.getComponent(GenomeSegment).worldPositions[1].z)
            .attr('length', e => e.getComponent(GenomeSegment).length)


        const exitSel = join
            .exit()
            .call((selection) => {
                // TODO clean up resources?
                console.log('removing', selection);
            })
            .remove()

        // this.render();
    }

    draw(self: GenomeModelSystem) {
        const lineGeometry = new THREE.Geometry();
        const elements = d3.select(this.sM.sm.renderer.domElement)
            .selectAll('genome-segment-component')
            .each(drawSegment)

        lineGeometry.verticesNeedUpdate = true;
        this.lineMesh.geometry = lineGeometry;


        function drawSegment(this: any) {
            const node = d3.select(this);

            const uuid = node.attr('uuid');
            const x0 = +node.attr('x0');
            const y0 = +node.attr('y0');
            const z0 = +node.attr('z0');
            const x1 = +node.attr('x1');
            const y1 = +node.attr('y1');
            const z1 = +node.attr('z1');
            const length = +node.attr('length');

            const t = self.gTS.worldSize / 1000 * Math.sin(performance.now() / 10000);

            const worldPositions = [
                new THREE.Vector3(x0, y0, z0),
                new THREE.Vector3(x1, y1, z1),
            ];

            const distance = worldPositions[0].distanceTo(worldPositions[1]);

            const linePositions = [
                new THREE.Vector3(0, 0, 0),
                // new THREE.Vector3(0, t, distance / 2),
                new THREE.Vector3(0, 0, distance / 2),
                new THREE.Vector3(0, 0, distance)
            ];

            const entity = self.sM.objectToEntity.get(uuid);

            if (!entity) {
                return;
            }
            const gs = entity.getComponent(GenomeSegment);
            if (!gs) {
                return;
            }

            lineGeometry.vertices.push(worldPositions[0].clone());

            entity.gameObject.transform.position.copy(worldPositions[0]);
            entity.gameObject.transform.lookAt(worldPositions[1]);
            const geometry = gs.line.geometry as THREE.Geometry;
            geometry.vertices[0] = linePositions[0];
            geometry.vertices[1] = linePositions[1];
            geometry.vertices[2] = linePositions[2];
            geometry.verticesNeedUpdate = true;
        }
    }

    gmsPositionToWorld(v: THREE.Vector3) {
        // scale along the bounding box. and map 
        const worldScale = this.gTS.worldSize;
        const details = this.gMS.loadChromosome(this.currentInterval.chr);
        return new THREE.Vector3(
            details.x(v.x) * worldScale,
            details.y(v.y) * worldScale,
            details.z(v.z) * worldScale
        );
    }

    getWorldPositions(e: Entity) {
        const ic = e.getComponent(IntervalComponent);
        const gs = e.getComponent(GenomeSegment);
        let worldPositions;
        if (this.modelLayout === 'String') {
            worldPositions = gs.positions.map(pos => this.gmsPositionToWorld(pos));
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
        return worldPositions;
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
        this.setupDrawRoutine();

        // let i = 0;
        // const layouts: GenomeModelLayout[] = ['Linear', 'Circular', 'String'];

        // setInterval(() => {
        //     this.modelLayoutSource.next(layouts[i % layouts.length]);
        //     i++;
        // }, 10000)

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

        geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(0, 0, 1));

        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        line.castShadow = true;
        line.receiveShadow = true;
        // e.gameObject.transform.add(line);
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