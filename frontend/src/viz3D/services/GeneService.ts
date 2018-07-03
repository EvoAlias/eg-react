import axios from 'axios';
import { Strand } from "../../model/Feature";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import { Observable, from } from 'rxjs';

export interface IGene {
    _id: string;
    id: string;
    chrom: string;
    strand: Strand;
    txStart: number;
    txEnd: number;
    cdsStart: number;
    cdsEnd: number;
    exonStarts: number[];
    exonEnds: number[];
    name: string;
    transcriptionClass: string;
    description: string;
}

export class GeneService {
    constructor(public url: string) {

    }

    getGenesInInterval$(genome: string, collection: string, interval: ChromosomeInterval): Observable<IGene[]> {
        const getData = axios.get(`${this.url}${genome}/genes/${collection}/queryRegion`, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            params: {
                chr: interval.chr,
                start: interval.start,
                end: interval.end,
            }
        })
            .then((data: any) => {
                const results = data.data.map((d: any) => {
                    const exonStarts = (d.exonStarts as string).split(',').slice(0, -1).map(Number);
                    const exonEnds = (d.exonEnds as string).split(',').slice(0, -1).map(Number);
                    return Object.assign(d, { exonStarts, exonEnds })
                })
                return results;
            });
        return from(getData);
    }
}