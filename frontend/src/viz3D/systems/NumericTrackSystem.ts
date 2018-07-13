import { SceneManagerSystem } from "./SceneManagerSystem";
import { System } from "../models/System";
import { Entity } from "../models/Entity";
import { IntervalComponent } from "../components/IntervalComponent";
import { Chart } from "../lib/chart/Chart";

import * as d3 from 'd3';
import * as THREE from 'three';
import { Component } from "../models/Component";
import { GenomeSegment, GenomeModelSystem } from "./GenomeModelSystem";
import { GenomeTreeSystem } from "./GenomeTree";
import { debounce, switchMap, map } from "rxjs/operators";
import { nearestPow2 } from "../lib/nearestPow2";
import { SelectedComponent } from "../components/SelectedComponent";

class ExamplePoint {
    num: number;
    constructor(public value: number) {
        this.num = 100 * Math.random()
    }

    id() {
        return this.value;
    }
    x() {
        return this.value;
    }
    y() {
        return this.num;
    }
}

export class NumericTrackComponent implements Component {
    name = NumericTrackComponent.name;

    chart: Chart;
    mesh: THREE.Mesh;
    constructor() { }
}

export class NumericTrackSystem extends System {
    sm: SceneManagerSystem;
    gTS: GenomeTreeSystem;
    gMS: GenomeModelSystem;

    chartMaterial: THREE.Material;
    chartGeometry: THREE.Geometry;
    chartMesh: THREE.Mesh;

    chartLength: number;
    chartHeight = 1;

    pixelsPerMeter = 32;

    chart: Chart;

    setupDrawRoutine() {
        // listen to entities change
        this.entities$.pipe(
            // rate limit
            debounce(() => this.ecs.fixedUpdate$)
        ).subscribe((entities) => {
            this.data(entities);
        });

        this.ecs.render$.subscribe(() => {
            this.draw(this);
        });
    }

    data(data: Entity[]) {
        // join is to update existing elements
        const join = d3.select(this.sm.sm.renderer.domElement)
            .selectAll('numeric-track-component')
            .data(data as any, (d: Entity) => {
                return `${d.id}`;
                // const ic = d.getComponent(IntervalComponent);
                // return ic.interval.id as any;
            });

        const enterSel = join.enter()
            .append('numeric-track-component')
            .attr('uuid', e => e.gameObject.transform.uuid);

        // merge
        join
            .merge(enterSel)

        const exitSel = join
            .exit()
            .remove()

    }

    draw(self: NumericTrackSystem) {
        const elements = d3.select(this.sm.sm.renderer.domElement)
            .selectAll('numeric-track-component')
            .each(drawChart)


        function drawChart(this: any) {
            const node = d3.select(this);
            
            const uuid = node.attr('uuid');

            const entity = self.sm.objectToEntity.get(uuid);

            const ntc = entity.getComponent(NumericTrackComponent);
            const gS = entity.getComponent(GenomeSegment);

            if (!ntc || !gS) {
                return;
            }

            ntc.mesh.scale.setX(gS.length);
        }
    }

    test(e: Entity) {
        return e.hasComponent(SelectedComponent) 
            && e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment)
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.gMS = this.ecs.getSystem(GenomeModelSystem);
        this.sm = this.ecs.getSystem(SceneManagerSystem);

        this.setupDrawRoutine();
    }

    enter(e: Entity) {
        const width = 512;
        const height = 512;
        const data = d3.range(50).map(v => new ExamplePoint(v));
        const chart = new Chart({
            width,
            height,
            xAxis: {
                title: 'x'
            },
            yAxis: {
                title: 'y (test)'
            }
        });
        chart.data(data);
        // document.body.appendChild(chart.mainCanvas);
        // document.body.appendChild(chart.hiddenCanvas);

        const texture = new THREE.CanvasTexture(chart.mainCanvas);
        texture.anisotropy = 16;
        const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture });

        const gS = e.getComponent(GenomeSegment);

        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0.5, 0.5, 0) );
        const mesh = new THREE.Mesh(geometry, material);

        mesh.lookAt(new THREE.Vector3(-1, 0, 0));
        
        chart.onRepaint = () => {
            texture.needsUpdate = true;
        }

        const ntc = new NumericTrackComponent();
        ntc.chart = chart;
        ntc.mesh = mesh;
        ntc.mesh.scale.setZ(0.5);

        e.addComponent(ntc);
        e.gameObject.transform.add(mesh);
    }

    exit(e: Entity) {
        const ntc = e.getComponent(NumericTrackComponent);

        if (ntc) {
            ntc.mesh.geometry.dispose();
            e.gameObject.transform.remove(ntc.mesh);
            e.removeComponent(NumericTrackComponent);
        }
    }

}