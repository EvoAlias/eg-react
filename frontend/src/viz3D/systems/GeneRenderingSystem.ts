import * as THREE from 'three';
import { Entity } from '../models/Entity';
import { GeneComponent, GenePart } from '../components/GeneComponent';
import { IntervalComponent } from '../components/IntervalComponent';
import { System } from '../models/System';
import { distinctUntilChanged, switchMap, map, throttle } from 'rxjs/operators';
import { GenomeTreeSystem } from './GenomeTree';

const GeneGeometry = new THREE.BoxGeometry(1, 1, 1);

export class GeneRenderSystem extends System {
    boxes: {[id: number]: THREE.Object3D} = {}
    gTS: GenomeTreeSystem;

    initializeResizeRoutine() {
        this.entities$.pipe(
            // do nothing until entities change
            distinctUntilChanged(),
            // listen to displayed region changes
            switchMap((entities) => this.gTS.viewToWorld$.pipe(
                // rearange parameters
                map((viewToWorld) => ({entities, viewToWorld}))
            ))
        ).subscribe(({entities, viewToWorld}) => {
            for (const entity of entities) {
                const ic = entity.getComponent(IntervalComponent);
                const box = this.boxes[entity.id];
                const startX = viewToWorld(ic.interval.start);
                const endX = viewToWorld(ic.interval.end);
                box.scale.setX(endX - startX);
            }
        })
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.initializeResizeRoutine(); 
    }

    test(entity: Entity) {
        const gc = entity.getComponent(GeneComponent);
        return gc && entity.hasComponent(IntervalComponent)
            && !(gc.genePart === GenePart.Transcription || gc.genePart === GenePart.Coding);
    }

    enter(entity: Entity) {
        const gc = entity.getComponent(GeneComponent);
        const mat = new THREE.MeshBasicMaterial({color: this.getGenePartColor(gc.genePart)})
        const mesh = new THREE.Mesh(GeneGeometry, mat);
        this.boxes[entity.id] = mesh;
        entity.gameObject.transform.add(mesh);
    }

    getGenePartColor(genePart: GenePart) {
        switch(genePart) {
            case GenePart.Transcription:
                return 'blue';
            case GenePart.Coding:
                return 'red';
            case GenePart.Exon:
                return 'green';
            case GenePart.Intron:
                return 'pink';
        }
    }
}