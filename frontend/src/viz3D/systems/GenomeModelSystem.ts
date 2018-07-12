import { System } from "../models/System";
import { SceneManagerSystem } from "./SceneManagerSystem";

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
import { SelectedComponent } from "./CameraSystem";
import { ChromosomeModelDetails, GenomeModelService } from "../services/GenomeModelService";
import { from } from "rxjs";
import { async } from "rxjs/internal/scheduler/async";
const STLLoader = require('three-stl-loader')(THREE);

export class GenomeSegment implements Component {
    readonly name = GenomeSegment.name;
    line: THREE.Line;
    length: number;

    debugX: THREE.Line;
    debugY: THREE.Line;
    debugZ: THREE.Line;
    constructor(public positions: THREE.Vector3[]) { }
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

export class GenomeModelSystem extends System {
    sM: SceneManagerSystem;
    gTS: GenomeTreeSystem;
    gMS: GenomeModelService;

    currentInterval: ChromosomeInterval;
    loadedChromosomes: {[chr: string]: boolean} = {};

    test(e: Entity) {
        return e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment);
    }

    async reloadView(viewRange: RangeInterval) {
        console.log('staring reload view')
        const interval = this.gTS.viewToChromosomeInterval(viewRange);

        // check if we've loaded this chromosome.
        if (this.loadedChromosomes[interval.chr]) {
            return;
        }
        // we haven't loaded this
        this.loadedChromosomes[interval.chr] = true;
        const details = await this.gMS.loadChromosomeAsync(interval.chr);

        // create entities for every interval in the genome model
        const chromosomeIntervals = details.genomicCoords.map((r) => new ChromosomeInterval('chr21', r[0], r[1]))
        const viewIntervals = chromosomeIntervals.map((i) => this.gTS.chromosomeIntervalToView(i));
        const length = viewIntervals.length;
        const entities = viewIntervals.map((range, i) => {
            const first = details.positions[i];
            const last = details.positions[Math.min(i + 1, length - 1)];

            const gs = new GenomeSegment([first, last]);
            const entity = this.gTS.createEntityWithInterval(range, [gs]);
            return entity;
        })
        entities.forEach(e => this.ecs.addEntity(e));
        this.currentInterval = interval;
        
        console.log('ending reload view')
    }

    subscribeOnEntityChange() {
        // Listen to entities change

        this.gTS.viewRange$.pipe(
            debounce(() => this.ecs.fixedUpdate$),
            tap(() => console.log('view changed')),
            // load entities in view
            switchMap((viewRange) => {
                return from(this.reloadView(viewRange))
            }),
            tap(() => console.log('reload view ended')),

            switchMap(() => {
                return this.entities$
            }),
            debounce(() => this.ecs.fixedUpdate$),
            tap(() => console.log('entities changed')),
        )
        .subscribe((entities) => {
            // console.log('entites', entities)
            this.data(entities);
        })
    }

    repositionEntity(e: Entity) {
        const gs = e.getComponent(GenomeSegment);
        const worldPositions = gs.positions.map(pos => this.getWorldPosition(pos));
        // Set the entities +z axis to the world position.

        const start = worldPositions[0];
        const end = worldPositions[1];
        const dir = worldPositions[1].clone().sub(worldPositions[0]);
        // set the transform to be the midpoint
        e.gameObject.transform.position.copy(start.clone().lerp(end, 0.5));
        e.gameObject.transform.lookAt(worldPositions[1]);

        // line should be centered at (0, 0, 0) pointing to (0, 0, length(vec));
        const startPoint = new THREE.Vector3(0, 0, - dir.length() / 2)
        const endPoint = new THREE.Vector3(0, 0, dir.length() / 2);

        gs.length = dir.length();

        (gs.line.geometry as THREE.Geometry).vertices[0] = startPoint;
        (gs.line.geometry as THREE.Geometry).vertices[1] = endPoint;
        (gs.line.geometry as THREE.Geometry).verticesNeedUpdate = true;
    }

    data(data: Entity[]) {
        console.log('new entities', data);
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
            // .call((selection) => {
            //     selection.each((e: Entity) => this.repositionEntity(e))
            // })

        // merge enter and update
        join
            .merge(enterSel)
            .call((selection) => {
                selection.each((e: Entity) => this.repositionEntity(e))
            })

        const exitSel = join
            .exit()
            .call((selection) => {
                console.log('remove', selection);
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

    onECSInit() {
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.gMS = this.ecs.getService(GenomeModelService);
        this.subscribeOnEntityChange();

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