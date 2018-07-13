import * as d3 from 'd3';
import * as THREE from 'three';
import { RangeInterval } from '../models/Range';
import ChromosomeInterval from '../../model/interval/ChromosomeInterval';

export interface ChromosomeModelDetails {
    boundingBox: THREE.Box3;
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    z: d3.ScaleLinear<number, number>;
    positions: THREE.Vector3[];
    genomicCoords: RangeInterval[];
    interval: ChromosomeInterval;
}

export class GenomeModelService {
    loadedChromosomes: {[chr: string]: ChromosomeModelDetails} = {};

    hasChromosome(chr: string): boolean {
        return !!this.loadedChromosomes[chr];
    }

    loadChromosome(chr: string): ChromosomeModelDetails {
        const details = this.loadedChromosomes[chr];
        if (details) {
            return details;
        }
        throw new Error(`chromosome ${chr} not loaded`);
    }
    
    async loadChromosomeAsync(chr: string): Promise<ChromosomeModelDetails> {
        const details = this.loadedChromosomes[chr];
        if (details) {
            return details;
        }
        console.log('fetching chr', chr);
        const response = await fetch(`/models/${chr}.json`);
        const data = await response.json();

        const boundingBox = new THREE.Box3();

        const genomicCoords: RangeInterval[] = [];
        const positions: THREE.Vector3[] = [];

        let prev: RangeInterval;
        let prevPos: THREE.Vector3;

        for(let i = 0; i < data.genomicCoords.length; i++) {
            const current: RangeInterval = data.genomicCoords[i];
            const pos = new THREE.Vector3(...data.xyzPositions[i]);
            if (i > 0 && prev[1] < current[0]) {
                const update = [prev[1], current[0]];
                const posUpdate = prevPos.clone().lerp(pos, 0.5);
                genomicCoords.push(update);
                positions.push(posUpdate);
            }

            genomicCoords.push(current);
            positions.push(pos);
            prev = current;
            prevPos = pos;
        }

        console.log('genomic', genomicCoords, positions);

        positions.forEach(pos => boundingBox.expandByPoint(pos));

        // check continuality
        for (let i = 0; i < genomicCoords.length - 1; i++) {
            if (genomicCoords[i][1] !== genomicCoords[i + 1][0]) {
                console.log('BREAK')
            }
        }

        for (const coords of genomicCoords) {
            if (coords[0] === coords[1]) {
                console.log('should coalesse')
            }
        }

        const interval = new ChromosomeInterval(
            chr,
            genomicCoords[0][0],
            genomicCoords[genomicCoords.length - 1][1]
        );

        const xLen = boundingBox.max.x - boundingBox.min.x;
        const yLen = boundingBox.max.y - boundingBox.min.y;
        const zLen = boundingBox.max.z - boundingBox.min.z;

        const largestLen = Math.max(xLen, yLen, zLen);

        // map positions to a percentage of the world size
        const x = d3.scaleLinear()
            .domain([boundingBox.min.x, boundingBox.max.x])
            .range([0, xLen / largestLen])

        const y = d3.scaleLinear()
            .domain([boundingBox.min.y, boundingBox.max.y])
            .range([0, yLen / largestLen])

        const z = d3.scaleLinear()
            .domain([boundingBox.min.z, boundingBox.max.z])
            .range([0, zLen / largestLen])

        this.loadedChromosomes[chr] = {
            boundingBox,
            x,
            y,
            z,
            positions,
            genomicCoords,
            interval
        }
        console.log('done fetching');
        return this.loadedChromosomes[chr];
    }
}