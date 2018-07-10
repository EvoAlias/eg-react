import { ChromosomeComponent } from "../components/ChromosomeComponent";
import { System } from "../models/System";
import { Entity, EntityID } from "../models/Entity";
import { GenomeTreeSystem } from "./GenomeTree";

import * as THREE from 'three';
import * as d3 from 'd3';
import { IntervalComponent } from "../components/IntervalComponent";
import { BehaviorSubject } from "rxjs";
import { switchMap, map, distinctUntilChanged, debounce, last } from "rxjs/operators";
import { GeneConformationService } from "../services/GenomeConformationService";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import { SceneManagerSystem } from "./SceneManagerSystem";
import { Vector3 } from "three";

const ChromosomeGeometry = new THREE.BoxGeometry(1, 1, 1);
const ChromosomeColors = d3.scaleSequential(d3.interpolateViridis).domain([0, 10]);
const ChromosomeLineMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff
})
const ConeGeometry = new THREE.ConeBufferGeometry( .1, .1, 32 );
const ConeMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );

export class ChromosomeRenderSystem extends System {
    // Dependent systems
    gTS: GenomeTreeSystem;
    sM: SceneManagerSystem;
    gCS: GeneConformationService;
    name = ChromosomeRenderSystem.name

    constructor() {
        super()
    }

    initializeSegmentCreationRoutine() {
        // get entities. Since they have interval components they are in the view
        this.entities$
            .pipe(
                // ratelimit to fixed update
                debounce(() => this.ecs.fixedUpdate$)
            )
            .subscribe((entities) => {
                for (const entity of entities) {
                    const cc = entity.getComponent(ChromosomeComponent);
                    if (cc.line) {
                        this.sM.sm.scene.remove(cc.line);
                    }
                    cc.geometry = new THREE.Geometry();
                    cc.line = new THREE.Line(cc.geometry, ChromosomeLineMaterial);


                    const viewRange = this.gTS.viewRange;
                    const entireChromosome = 
                        new ChromosomeInterval(cc.chromosome.getName(), 0, cc.chromosome.getLength());
                    const chromosomeViewRange = this.gTS.chromosomeIntervalToView(entireChromosome);
                    // determine overlap
                    const overlap = [
                        Math.max(viewRange[0], chromosomeViewRange[0]),
                        Math.min(viewRange[1], chromosomeViewRange[1])
                    ];

                    const chromosomeSegment = this.gTS.viewToChromosomeInterval(overlap);
                    const chromosomeSegmentViewRange = this.gTS.chromosomeIntervalToView(chromosomeSegment);

                    const width = chromosomeSegmentViewRange[1] - chromosomeSegmentViewRange[0];
                    const incr = width / 1000;
                    const startPos = this.gCS.getPositionAt(chromosomeSegmentViewRange[0]);
                    let lastPos = startPos;
                    for (let i = chromosomeSegmentViewRange[0]; i < chromosomeSegmentViewRange[1]; i += incr) {
                        const pos = this.gCS.getPositionAt(i);
                        pos.x = this.gTS.viewToWorld(i);
                        cc.geometry.vertices.push(pos);

                        // create an arrow in the direction of the
                        const cameraDir = new Vector3(0, 0, 1);
                        // camera looks down the negative z axis
                        // this.sM.sm.camera.getWorldDirection(cameraDir);
                        // cameraDir.multiplyScalar(-1);
                        const cone = new THREE.Mesh(ConeGeometry, ConeMaterial);
                        cone.position.copy(lastPos);
                        cone.lookAt(pos);
                        cone.rotateX(Math.PI / 2);
                        

                        this.sM.sm.scene.add(cone);
                        lastPos = pos
                    }
                    cc.geometry.verticesNeedUpdate = true;
                    const geometry = cc.geometry;
                    geometry.verticesNeedUpdate = true;
                    geometry.elementsNeedUpdate = true;
                    geometry.uvsNeedUpdate = true;
                    geometry.normalsNeedUpdate = true;
                    geometry.colorsNeedUpdate = true;
                    
                    this.sM.sm.scene.add(cc.line);
                    console.log('modifying entity', entity, cc.geometry)
                }
            })
    }

    onECSInit() {
        this.gTS = this.ecs.getSystem(GenomeTreeSystem);
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.gCS = this.ecs.getService(GeneConformationService);
        this.initializeSegmentCreationRoutine();
    }

    test(entity: Entity) {
        return entity.hasComponent(ChromosomeComponent) && entity.hasComponent(IntervalComponent);
    }

    enter(entity: Entity) {
        const cc = entity.getComponent<ChromosomeComponent>(ChromosomeComponent);

        
        // entity.gameObject.transform.add(cc.line);
        this.sM.sm.scene.add(this.makeMesh(1))
    }

    exit(entity: Entity) {

    }


    makeMesh(index: any) {
        const material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });
        
        const geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( -10, 0, 0 ),
            new THREE.Vector3( 0, 10, 0 ),
            new THREE.Vector3( 10, 0, 0 )
        );
        
        const line = new THREE.Line( geometry, material );
        return line
    }
}