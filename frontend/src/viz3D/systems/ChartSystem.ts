import { System } from "../models/System";
import { Entity } from "../models/Entity";

import { SimpleGridShader } from "../shaders/simple_grid/grid";

import * as THREE from 'three';
import * as d3 from 'd3';
import { ChartComponent } from "../components/ChartComponent";
import { SceneManager } from "../models/SceneManager";
import { SceneManagerSystem } from "./SceneManagerSystem";
import { createCartesianShader } from "../shaders/grid/grid";
import { AnyLoader } from "three";
import { Chart } from "../lib/chart/Chart";

class ExamplePoint {
    constructor(public value: number) {}
    
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

export class ChartSystem extends System {
    sm: SceneManagerSystem;

    onECSInit() {
        // Shader Test

        // const sm = this.ecs.getSystem<SceneManagerSystem>(SceneManagerSystem);
        // this.sm = sm;
        // const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
        // const mat = createCartesianShader({
        //     domain: [-5, 5, -5, 5]
        // });
        // const plane = new THREE.Mesh(geometry, mat)
        // this.sm.sm.scene.add(plane);

        // Canvas test
        
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
        document.body.appendChild(chart.mainCanvas);
        
        const sm = this.ecs.getSystem<SceneManagerSystem>(SceneManagerSystem);
        this.sm = sm;
        
        const texture = new THREE.CanvasTexture(chart.mainCanvas);
        texture.anisotropy = 16;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.PlaneGeometry(5, 2.5);
        const mesh = new THREE.Mesh(geometry, material);
        this.sm.sm.scene.add(mesh);
    }

    test(e: Entity) {
        return e.hasComponent(ChartComponent);
    }

    addEntity(e: Entity) {
        // const geometry = new THREE.PlaneGeometry(11, 11, 10, 10);
        // const mat = new THREE.MeshBasicMaterial({color:0xffff00, side: THREE.DoubleSide})
        // const plane = new THREE.Mesh(geometry, SimpleGridShader)
        // const background = new THREE.Mesh(geometry, mat);
        // background.position.z = -1;
        // e.gameObject.transform.add(plane);
        // e.gameObject.transform.add(background);
    }

}