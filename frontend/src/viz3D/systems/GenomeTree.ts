import IntervalTree, { Interval } from 'interval-tree2';
import { GenomeConfig } from '../../model/genomes/Genome';

import { includes } from 'lodash';
import { ChromosomeComponent } from '../components/ChromosomeComponent';
import { System } from '../models/System';
import { Entity } from '../models/Entity';
import { IntervalComponent } from '../components/IntervalComponent';
import { GameObject } from '../components/GameObject';

export class GenomeTreeSystem extends System {
    intervalTree: IntervalTree;

    currentChromosome: string;
    chromosomeOffsets: { [name: string]: number } = {};
    chromosomeIntervals: { [name: string]: Interval } = {};
    chromosomeEntities: { [name: string]: Entity } = {};

    rootNode: THREE.Group;

    private bpCount: number; // total number of base pairs

    constructor(public config: GenomeConfig) {
        super();
    }

    test(entity: Entity) {
        return entity.hasComponent(IntervalComponent);
    }

    enter(entity: Entity) {

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

            const entity = this.chromosomeEntities[c.getName()] = new Entity([new IntervalComponent(interval), new ChromosomeComponent(c)]);
            this.ecs.addEntity(entity);
        });
    }
}