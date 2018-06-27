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

import { BehaviorSubject } from 'rxjs';
import { switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { ChartComponent } from '../components/ChartComponent';

export class GenomeTreeSystem extends System {
    // Interval tree representing elements/features of the gemome.
    intervalTree: IntervalTree;

    // Current chromosme we are on.
    currentChromosome: string;
    // Chromosome positions offset from absolute.
    chromosomeOffsets: { [name: string]: number } = {};
    // Intervals representing an entire chromosome
    chromosomeIntervals: { [name: string]: Interval } = {};
    // Entities with an IntervalComponent representing an entire chromosome.
    chromosomeEntities: { [name: string]: Entity } = {};

    // Entities to update this cycle. 
    toUpdateSubject: BehaviorSubject<Entity[]> = new BehaviorSubject<Entity[]>([]);
    toUpdate$ = this.toUpdateSubject.asObservable();

    // Linear size in THREEjs units (meters)
    worldSizeSubject: BehaviorSubject<RangeInterval> = new BehaviorSubject<RangeInterval>([0, 10]);
    worldSize$ = this.worldSizeSubject.asObservable();

    viewRangeSubjcet: BehaviorSubject<RangeInterval> = new BehaviorSubject<RangeInterval>([0, 1]);
    viewRange$ = this.viewRangeSubjcet.asObservable();

    viewToWorld$ = this.worldSizeSubject.pipe(
        switchMap((world) => this.viewRange$.pipe(
            map((view) => ({world, view}))
        )),
        map(({world, view}) => d3.scaleLinear().domain(view).range(world))
    )

    worldToView$ = this.worldSizeSubject.pipe(
        switchMap((world) => this.viewRange$.pipe(
            map((view) => ({world, view}))
        )),
        map(({world, view}) => d3.scaleLinear().domain(view).range(world))
    )

    // Total number of base pairs.
    private bpCount: number; // total number of base pairs

    constructor(public config: GenomeConfig) {
        super();
    }

    test(entity: Entity) {
        return entity.hasComponent(IntervalComponent);
    }

    initializeRepositioningRoutine() {
        this.toUpdate$.pipe(
            distinctUntilChanged(),
            switchMap((entities) => this.viewToWorld$.pipe(
                map((viewToWorld) => ({entities, viewToWorld}))
            ))
        ).subscribe(({entities, viewToWorld}) => {
            for (const entity of entities) {
                const ic = entity.getComponent<IntervalComponent>(IntervalComponent);
                const startX = viewToWorld(ic.interval.start);
                entity.gameObject.transform.position.x = viewToWorld(ic.interval.start);
            }
        })
    }

    onECSInit() {
        this.initializeRepositioningRoutine();
    }

    init() {
        // figure out the maxinum number of base pairs.
        const chromosomes = this.config.genome.getAllChromosomes();
        const bpCount = chromosomes.reduce((acc, c) => acc + c.getLength(), 0);
        // set main interval tree as well as start points
        this.intervalTree = new IntervalTree(bpCount / 2);

        let currentOffset = 0;
        chromosomes.forEach((c) => {
            this.chromosomeOffsets[c.getName()] = currentOffset
            const interval = this.chromosomeIntervals[c.getName()] = this.intervalTree.add(currentOffset, currentOffset + c.getLength());
            currentOffset += c.getLength();

            const entity = this.chromosomeEntities[c.getName()] = new Entity([new IntervalComponent(interval), new ChromosomeComponent(c)]); //, new ChartComponent()]);
            this.ecs.addEntity(entity);
        });
        this.updateViewRange([0, bpCount]);
    }

    fixedUpdate(entities: Entity[]) {
        this.toUpdateSubject.next(entities);
    }

    updateViewRange(viewRange: RangeInterval) {
        this.viewRangeSubjcet.next(viewRange);
    }
}