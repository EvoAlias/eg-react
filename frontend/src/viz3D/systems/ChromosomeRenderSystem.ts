import { ChromosomeComponent } from "../components/ChromosomeComponent";
import { System } from "../models/System";
import { Entity, EntityID } from "../models/Entity";
import * as THREE from 'three';
import { Mesh } from "three";
import { GenomeTreeSystem } from "./GenomeTree";

const ChromosmeMat = new THREE.MeshBasicMaterial({color: 0x00ff00});


export class ChromosomeRenderSystem extends System {
    name = ChromosomeRenderSystem.name

    boxes: {[id: string]: Mesh} = {};
    
    constructor() {
        super()
    }

    test(entity: Entity) {
        return entity.hasComponent(ChromosomeComponent);
    }

    enter(entity: Entity) {
        const cc = entity.getComponent<ChromosomeComponent>(ChromosomeComponent)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = ChromosmeMat;
        const mesh = this.boxes[entity.id] = new THREE.Mesh(geometry, material);
        const gT = this.ecs.getSystem<GenomeTreeSystem>(GenomeTreeSystem);
        const index = gT.config.genome.getAllChromosomes().indexOf(cc.chromosome);
        mesh.position.x = index * 2;
    }
}