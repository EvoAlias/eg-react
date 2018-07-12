import IntervalTree, { Interval } from 'interval-tree2';
import { GenomeConfig } from '../../model/genomes/Genome';

import { includes } from 'lodash';
import { ChromosomeComponent } from '../components/ChromosomeComponent';
import { System } from '../models/System';
import { Entity } from '../models/Entity';
import { IntervalComponent } from '../components/IntervalComponent';
import { GameObject } from '../components/GameObject';

import { RangeInterval } from '../models/Range';

import * as d3 from 'd3';

import { BehaviorSubject, interval } from 'rxjs';
import { switchMap, map, distinctUntilChanged, tap, throttle, debounce } from 'rxjs/operators';
import { ChartComponent } from '../components/ChartComponent';
import ChromosomeInterval from '../../model/interval/ChromosomeInterval';
import { TwoBitService } from '../services/TwoBitService';
import { GeneService } from '../services/GeneService';
import { GeneComponent, GenePart } from '../components/GeneComponent';
import { Component, ComponentConstructor } from '../models/Component';
import { SceneManagerSystem } from './SceneManagerSystem';

export class GenomeTreeSystem extends System {
    sM: SceneManagerSystem;

    twoBitService: TwoBitService;
    geneService: GeneService;
    
    // Interval tree representing elements/features of the gemome.
    intervalTree: IntervalTree;
    // Helps system keep track of whether an enitity exist for this interval. If it created it.
    intervalToEntity: { [intervalID: number]: Entity} = {};

    // Current chromosme we are on.
    currentChromosome: string;
    // Chromosome positions offset from absolute.
    chromosomeOffsets: { [name: string]: number } = {};
    // Chromosome position ends
    chromosomeEnds: { [name: string]: number } = {};
    // Intervals representing an entire chromosome
    chromosomeIntervals: { [name: string]: Interval } = {};
    // Entities with an IntervalComponent representing an entire chromosome.
    chromosomeEntities: { [name: string]: Entity } = {};

    // Entities to update this cycle. 
    toUpdateSubject: BehaviorSubject<Entity[]> = new BehaviorSubject<Entity[]>([]);
    toUpdate$ = this.toUpdateSubject.asObservable();

    // Linear size in THREEjs units (meters)
    // Ex. worldsize is 10. Everything in the world fits in the box 10 units out from all axis.
    private worldSizeSubject: BehaviorSubject<number> = new BehaviorSubject<number>(100);
    worldSize$ = this.worldSizeSubject.asObservable();
    get worldSize() {
        return this.worldSizeSubject.getValue();
    }

    private viewRangeSubject: BehaviorSubject<RangeInterval> = new BehaviorSubject<RangeInterval>([0, 1000]);
    viewRange$ = this.viewRangeSubject.asObservable();
    get viewRange() {
        return this.viewRangeSubject.getValue();
    }

    // Total number of base pairs.
    private bpCount: number; // total number of base pairs

    constructor(public config: GenomeConfig) {
        super();
    }

    test(entity: Entity) {
        // This system adds entities and removes entitie with intervalComponents but doesnt do anything with them.
        return entity.hasComponent(IntervalComponent);
    }

    initializeRepositioningRoutine() {
        // this.entities$.pipe(
        //     distinctUntilChanged(),
        //     debounce(() => this.ecs.fixedUpdate$),
        //     switchMap((entities) => this.viewToWorld$.pipe(
        //         map((viewToWorld) => ({entities, viewToWorld}))
        //     ))
        // ).subscribe(({entities, viewToWorld}) => {
        //     console.log('repositioning entities');
        //     for (const entity of entities) {
        //         const ic = entity.getComponent<IntervalComponent>(IntervalComponent);
        //         const startX = viewToWorld(ic.interval.start);
        //         // console.log('\t', entity, startX);
        //         entity.gameObject.transform.position.x = startX;
        //     }
        // })
    }

    initializeGeneLoadingRoutine() {
        // this.viewRange$.pipe(
        //     distinctUntilChanged(),
        //     // convert the view to a chromosome interval
        //     tap((range) => console.log('Updated view range', range)),
        //     map((range) => this.viewToChromosomeInterval(range)),
        //     tap((interval) => console.log('Updated chromosome interval', interval)),
        //     // Take the current chromosome interval and fetch the twobit
        //     // Use switchmap here as it has cancelation and will cancel previous request
        //     switchMap((interval) => {
        //         return this.geneService.getGenesInInterval$('hg19', 'refGene', interval)
        //     })
        // ).subscribe((results) => {
        //     // iterate through results and create entitys covering the intervals.
        //     console.log('Results', results)
        //     for (const result of results) {
        //         console.log('result', result);
        //         const entities = [];
        //         // create an entity for the entire gene
        //         const txRange = 
        //             this.chromosomeIntervalToView(
            // new ChromosomeInterval(result.chrom, result.txStart, result.txEnd));
        //         const txEntity = 
        //             this.findOrCreateEntityWithInterval(
            // txRange, [new GeneComponent(result, GenePart.Transcription)]);
        //         entities.push(txEntity);
        //         // create an entity for the coding region
        //         const cdsRange = 
        //             this.chromosomeIntervalToView(
            // new ChromosomeInterval(result.chrom, result.cdsStart, result.cdsEnd));
        //         const cdsEntity = 
        //             this.findOrCreateEntityWithInterval(cdsRange, [new GeneComponent(result, GenePart.Coding)]);
        //         entities.push(cdsEntity);
        //         // create an entity for every exon
        //         const exons = result.exonStarts.map((start, i) => [start, result.exonEnds[i]]);
        //         const exonEntities: Entity[] = [];
        //         for (const exon of exons) {
        //             const exonRange = 
        //                 this.chromosomeIntervalToView(new ChromosomeInterval(result.chrom, exon[0], exon[1]));
        //             const exonEntity = 
        //                 this.findOrCreateEntityWithInterval(exonRange, [new GeneComponent(result, GenePart.Exon)]);
        //             entities.push(exonEntity);
        //             exonEntities.push(exonEntity);
        //         }
        //         // create an entity for introns
        //         const intronEntities: Entity[] = [];
        //         if (result.exonStarts.length > 1) {
        //             for(let i = 0; i < result.exonEnds.length - 1; i++) {
        //                 const intron = [result.exonEnds[i], result.exonStarts[i + 1]];
        //                 const intronRange = 
        //                     this.chromosomeIntervalToView(
            // new ChromosomeInterval(result.chrom, intron[0], intron[1]));
        //                 const intronEntity = 
        //                     this.findOrCreateEntityWithInterval(intronRange,
        //                         [new GeneComponent(result, GenePart.Intron)]);
        //                 entities.push(intronEntity);
        //                 intronEntities.push(intronEntity);
        //             }
        //         }
        //         // add entity to ecs
        //         entities.forEach((entity) => {
        //             const c = entity.getComponent(GeneComponent);
        //             c.txEntity = txEntity;
        //             c.codingEntity = cdsEntity;
        //             c.exonEntities = exonEntities;
        //             c.intronEntities = intronEntities;

        //             this.ecs.addEntity(entity);
        //         });
                
        //     }
        // })
    }
    

    /**
     * This routine checks changes to the view. It will load entities within
     * the view range, and unload entities that are not in the view range.
     *
     * @memberof GenomeTreeSystem
     */
    initializeLoadingAndUnloadingRoutine() {
        // We firt want to check whenver the view range changes
        this.viewRange$.pipe(
            // check whatever the current entities in view are
            switchMap((viewRange) => this.entities$.pipe(
                // combine the view range and current entities
                map((entities) => ({viewRange, currentEntites: entities}))
            )),
            // Rate limit this to the ECS fixed update
            debounce(() => this.ecs.fixedUpdate$)
        )
        .subscribe(({viewRange, currentEntites}) => {
            // First get all intervals in current range.
            const inRange = this.intervalTree.rangeSearch(viewRange[0], viewRange[1]);

            // use d3 to track intervals in and out of range.
            const join = d3.select(this.sM.sm.renderer.domElement)
                .selectAll('interval-component')
                .data(inRange as any, (d: Interval) => `${d.id}`)

            const enterSel = join.enter()
                .append('interval-component')
                .call((selection) => {
                    selection.each((i: Interval) => {
                        this.ecs.addEntity(this.intervalToEntity[i.id])
                    })
                })

            join
                .merge(enterSel)

            const exitSel = join
                .exit()
                .call((selection) => {
                    selection.each((i: Interval) => {
                        this.ecs.removeEntity(this.intervalToEntity[i.id])
                    })
                })
                .remove()

            // // pick entities to remove from ecs;
            // const toRemove = currentEntites.filter((e) => {
            //     const ic = e.getComponent(IntervalComponent);
            //     const foundIntervalInRange = inRange.find(interval => interval.id === ic.interval.id);
            //     return !foundIntervalInRange;
            // });
            // toRemove.forEach(e => this.ecs.removeEntity(e));

            // // pick entities to add to ecs;
            // const toAdd = inRange.map((interval) => {
            //     return this.intervalToEntity[interval.id];
            // })
            // // remove entites in current entities list
            // .filter(e => currentEntites.indexOf(e) === -1);
            // toAdd.forEach(e => this.ecs.addEntity(e));
        });
    }

    onECSInit() {
        this.sM = this.ecs.getSystem(SceneManagerSystem);
        this.twoBitService = this.ecs.getService(TwoBitService);
        this.geneService = this.ecs.getService(GeneService);
        this.initializeLoadingAndUnloadingRoutine();
        // this.initializeRepositioningRoutine();
        // this.initializeGeneLoadingRoutine();
    }

    init() {
        // figure out the maxinum number of base pairs.
        const chromosomes = this.config.genome.getAllChromosomes();
        const bpCount = chromosomes.reduce((acc, c) => acc + c.getLength(), 0);
        // set main interval tree as well as start points
        this.intervalTree = new IntervalTree(bpCount / 2);
        // If all goes well for the human genome currentOffset starts at 0 and ends at 3 billion
        let currentOffset = 0;
        // chromosomes are assumed to be in sorted order
        chromosomes.forEach((c) => {
            // The chromosomeOffset is the end of the last chromosome
            this.chromosomeOffsets[c.getName()] = currentOffset

            // Create an interval representing this chromosome
            const interval = [currentOffset, currentOffset + c.getLength()];
            
            // Update the current offset to now be the end of this one
            currentOffset += c.getLength();
            
            // Mark the chromosome end
            this.chromosomeEnds[c.getName()] = currentOffset;

            // Create an entity that represents this chromosme
            const entity = this.chromosomeEntities[c.getName()] = 
                this.createEntityWithInterval(interval as any, [new ChromosomeComponent(c)]);
            
            // Cache the specific interval for this chromosome
            const ic = entity.getComponent(IntervalComponent);
            this.chromosomeIntervals[c.getName()] = ic.interval;
        });
        // this.updateViewRange([0, 100000]);
    }

    updateViewRange(viewRange: RangeInterval) {
        this.viewRangeSubject.next(viewRange);
    }

    // helpers
    createEntityWithInterval(interval: RangeInterval, 
        components: Array<Component | ComponentConstructor<Component>>): Entity 
    {
        if (interval[0] === interval[1]) {
            interval = [interval[0], interval[1] + 1];
        }
        const i = 
            this.intervalTree.add(interval[0], interval[1]);
        
            
        const entity = new Entity([new IntervalComponent(i,
            this.viewToChromosomeInterval([i.start, i.end])), ...components]); 
        const ic = entity.getComponent(IntervalComponent);
        this.intervalToEntity[ic.interval.id] = entity;
        return entity;
    }

    private findOrCreateEntityWithInterval(interval: RangeInterval, 
        components: Array<Component | ComponentConstructor<Component>>): Entity 
    {
        const entity = this.intervalToEntity[interval as any];
        if (entity) {
            return entity;
        }
        return this.createEntityWithInterval(interval, components);
    }

    viewToChromosomeInterval(interval: RangeInterval): ChromosomeInterval {
        const chromosomes = Object.keys(this.chromosomeOffsets);
        chromosomes.sort((a, b) => {
            return this.chromosomeOffsets[a] - this.chromosomeOffsets[b]
        })
        const offsets = chromosomes.map(a => this.chromosomeOffsets[a]);
        let start;
        for (start = chromosomes.length - 1; start >= 0 && offsets[start] > interval[0]; start--) {}
        
        const offset = interval[0] - offsets[start];
        const startPos = offset;
        const endPos = offset + (interval[1] - interval[0]);
        return new ChromosomeInterval(chromosomes[start], startPos, endPos);
    }

    chromosomeIntervalToView(interval: ChromosomeInterval): RangeInterval {
        const offset = this.chromosomeOffsets[interval.chr];
        return [offset + interval.start, offset + interval.end];
    }
}