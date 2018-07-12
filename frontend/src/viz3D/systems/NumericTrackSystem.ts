import { SceneManagerSystem } from "./SceneManagerSystem";
import { System } from "../models/System";
import { Entity } from "../models/Entity";
import { SelectedComponent } from "./CameraSystem";
import { IntervalComponent } from "../components/IntervalComponent";
import { Chart } from "../lib/chart/Chart";

import * as d3 from 'd3';
import * as THREE from 'three';
import { Component } from "../models/Component";
import { GenomeSegment, GenomeModelSystem } from "./GenomeModelSystem";
import { GenomeTreeSystem } from "./GenomeTree";
import { debounce, switchMap, map } from "rxjs/operators";
import { nearestPow2 } from "../lib/nearestPow2";

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
        return false;
        // return e.hasComponent(SelectedComponent) 
        // && e.hasComponent(IntervalComponent) && e.hasComponent(GenomeSegment)
    }

    setupChartGeometryRefresh() {
        // The first change we want to listen to is the view range change
        this.gTS.viewRange$.pipe(
            // Rate limit by the fixed update cycle
            debounce(() => this.ecs.fixedUpdate$),
            // now we want to listen to when the GMS is done animating
            switchMap((viewRange) => {
                return this.gMS.animating$.pipe(
                    // combine paramaters
                    map((animating) => ({ viewRange, animating }))
                )
            })
        ).subscribe(({ viewRange, animating }) => {
            if (animating) {
                this.sm.sm.scene.remove(this.chartMesh);
                return;
            }
            const lineGeometry = this.gMS.lineGeometry;
            const l = lineGeometry.vertices.length;
            if (l === 0) {
                return;
            }
            // If done animating grab the line and then extrude it upwards to form the base of the chart
            const geometry = new THREE.PlaneGeometry(0, 0, l - 1, 1);
            const vertices = geometry.vertices;

            const depth = this.chartHeight;

            this.chartLength = 0;
            let lastPoint = lineGeometry.vertices[0];

            for (let i = 0; i < l; i++) {
                const p = lineGeometry.vertices[i];

                vertices[i].x = vertices[i + l].x = p.x;
                vertices[i].z = vertices[i + l].z = p.z;

                vertices[i + l].y = p.y;
                vertices[i].y = p.y + depth;

                this.chartLength += lastPoint.distanceTo(p);
                lastPoint = p;
            }

            geometry.computeFaceNormals();

            this.chartGeometry.dispose();
            this.chartGeometry = geometry;
            this.chartMesh.geometry = geometry;
            this.chartMesh.geometry.verticesNeedUpdate = true;
            // console.log('done updating chart mesh', this.chartGeometry, lineGeometry);

            this.refreshChart();
        })
    }

    refreshChart() {
        const width = this.pixelsPerMeter * nearestPow2(this.chartLength);
        const height = this.pixelsPerMeter * this.chartHeight;

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
        texture.minFilter = THREE.NearestMipMapLinearFilter;
        texture.anisotropy = 16;
        this.chartMaterial= new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture });
        this.chartMesh.material = this.chartMaterial;
        this.chartMaterial.needsUpdate = true;

        chart.onRepaint = () => {
            texture.needsUpdate = true;
        }
        this.sm.sm.scene.add(this.chartMesh);
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.gMS = this.ecs.getSystem(GenomeModelSystem);
        this.sm = this.ecs.getSystem(SceneManagerSystem);

        const geometry = new THREE.PlaneGeometry(5, 20, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, wireframe: true });
        const plane = new THREE.Mesh(geometry, material);

        this.chartMaterial = material;
        this.chartGeometry = geometry;
        this.chartMesh = plane;

        this.sm.sm.scene.add(plane);

        this.setupChartGeometryRefresh();

        const testGeometry = new THREE.PlaneGeometry(10, 10, 10, 1);
        console.log(testGeometry);
    }

    enter(e: Entity) {
        console.log('entered nts', e);
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
        const geometry = new THREE.PlaneGeometry(5, 2.5);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.lookAt(new THREE.Vector3(-1, 0, 0));

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