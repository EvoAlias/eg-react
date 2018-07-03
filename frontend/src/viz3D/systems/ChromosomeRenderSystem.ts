import { ChromosomeComponent } from "../components/ChromosomeComponent";
import { System } from "../models/System";
import { Entity, EntityID } from "../models/Entity";
import { GenomeTreeSystem } from "./GenomeTree";

import * as THREE from 'three';
import * as d3 from 'd3';
import { IntervalComponent } from "../components/IntervalComponent";
import { BehaviorSubject } from "rxjs";
import { switchMap, map, distinctUntilChanged } from "rxjs/operators";

const ChromosomeGeometry = new THREE.BoxGeometry(1, 1, 1);
const ChromosomeColors = d3.scaleSequential(d3.interpolateViridis).domain([0, 10]);

export class ChromosomeRenderSystem extends System {
    // Dependent systems
    gTS: GenomeTreeSystem;
    
    name = ChromosomeRenderSystem.name
    boxes: {[index: number]: THREE.Mesh} = {};
    assignedIndex: {[id: number]: number} = {};

    toUpdateSubject: BehaviorSubject<Entity[]> = new BehaviorSubject<Entity[]>([]);
    toUpdate$ = this.toUpdateSubject.asObservable();

    constructor() {
        super()
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.initializeResizeRoutine();
    }

    initializeResizeRoutine() {
        this.toUpdateSubject.pipe(
            distinctUntilChanged(),
            switchMap((entities) => this.gTS.viewToWorld$.pipe(
                map((viewToWorld) => ({entities, viewToWorld}))
            ))
        ).subscribe(({entities, viewToWorld}) => {
            for (const entity of entities) {
                // resize box geometry based off interval
                const ic = entity.getComponent<IntervalComponent>(IntervalComponent);
                const box = this.boxes[this.assignedIndex[entity.id]];
                const startX = viewToWorld(ic.interval.start);
                const endX = viewToWorld(ic.interval.end);
                box.scale.setX(endX - startX);
            }
        }) 
    }

    fixedUpdate(entities: Entity[], elapsed: number) {
        this.toUpdateSubject.next(entities);
    }

    test(entity: Entity) {
        return entity.hasComponent(ChromosomeComponent) && entity.hasComponent(IntervalComponent);
    }

    enter(entity: Entity) {
        const cc = entity.getComponent<ChromosomeComponent>(ChromosomeComponent)
        const index = this.gTS.config.genome.getAllChromosomes().indexOf(cc.chromosome);
        const mesh = this.boxes[index] = this.boxes[index] || this.makeMesh(index); 
        this.assignedIndex[entity.id] = index;

        // mesh.position.x = index * 2;
        
        // const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const material = ChromosmeMat;
        // const mesh = this.boxes[entity.id] = new THREE.Mesh(geometry, material);

        
        entity.gameObject.transform.add(mesh);
    }

    exit(entity: Entity) {
        entity.gameObject.transform.remove(this.boxes[this.assignedIndex[entity.id]]);
    }

    
    makeMesh(index: any) {
        const material = new THREE.MeshBasicMaterial({color: ChromosomeColors(index)});
        const mesh = new THREE.Mesh(ChromosomeGeometry, material);
        return mesh;
    }
}