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
    constructor(public value: number) { }

    id() {
        return this.value;
    }
    x() {
        return this.value;
    }
    y() {
        return this.value;
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

    test(e: Entity) {
        return e.hasComponent(SelectedComponent) 
            && e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment)
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.gMS = this.ecs.getSystem(GenomeModelSystem);
        this.sm = this.ecs.getSystem(SceneManagerSystem);
    }

    enter(e: Entity) {
        const width = 512;
        const height = 256;
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

        const geometry = new THREE.PlaneGeometry(gS.getLength(), 5);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.lookAt(new THREE.Vector3(-1, 0, 0));
        mesh.up.set(0, 1, 0);
        mesh.position.setY(2.5);
        console.log('mesh', mesh, gS, gS.getLength());

        chart.onRepaint = () => {
            texture.needsUpdate = true;
        }

        const ntc = new NumericTrackComponent();
        ntc.chart = chart;
        ntc.mesh = mesh;


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