import Chromosome from "../../model/genomes/Chromosome";
import { Entity } from "../models/Entity";
import { Component } from "../models/Component";
import IntervalTree from "interval-tree2";

export class ChromosomeComponent implements Component{
    readonly name = ChromosomeComponent.name;
    intervalTree: IntervalTree;

    geometry: THREE.Geometry;
    line: THREE.Line;

    constructor(public chromosome: Chromosome) {
        this.intervalTree = new IntervalTree(chromosome.getLength() / 2);
    }
}
