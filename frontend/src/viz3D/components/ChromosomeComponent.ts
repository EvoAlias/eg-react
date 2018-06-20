import Chromosome from "../../model/genomes/Chromosome";
import { Entity } from "../models/Entity";
import * as THREE from 'three';
import { Component } from "../models/Component";

export class ChromosomeComponent implements Component{
    constructor(public chromosome: Chromosome) {}
}
