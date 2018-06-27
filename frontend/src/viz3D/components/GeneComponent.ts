import { IGene } from "../services/GeneService";
import { Entity } from "../models/Entity";
import { Strand } from "../../model/Feature";

export enum GenePart {
    Transcription = "Transcription",
    Coding = "Coding",
    Exon = "Exon",
    Intron = "Intron"
}

export class GeneComponent {
    readonly name = GeneComponent.name;
    txEntity: Entity;
    codingEntity: Entity;
    exonEntities: Entity[];
    intronEntities: Entity[];

    /**
     *Creates an instance of GeneComponent.
     * @param {IGene} gene
     * @param {GenePart} genePart
     * @memberof GeneComponent
     */
    constructor(public gene: IGene, public genePart: GenePart) {}
}

