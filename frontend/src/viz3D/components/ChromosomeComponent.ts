import Chromosome from "../../model/genomes/Chromosome";
import { Entity } from "../models/Entity";
import { Component } from "../models/Component";

export class ChromosomeComponent implements Component{
    readonly name = ChromosomeComponent.name;
    constructor(public chromosome: Chromosome) {}
}
