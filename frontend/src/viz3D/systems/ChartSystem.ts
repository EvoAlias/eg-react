import { System } from "../models/System";
import { Entity } from "../models/Entity";

import { GridShader } from "../shaders/grid";

import * as THREE from 'three';
import { ChartComponent } from "../components/ChartComponent";

export class ChartSystem extends System {

    test(e: Entity) {
        return e.hasComponent(ChartComponent);
    }

    addEntity(e: Entity) {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const mat = new THREE.MeshBasicMaterial({color:0xffff00, side: THREE.DoubleSide})
        const plane = new THREE.Mesh(geometry, GridShader)
        const background = new THREE.Mesh(geometry, mat);
        background.position.z = -1;
        e.gameObject.transform.add(plane);
        e.gameObject.transform.add(background);
    }

}