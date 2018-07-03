import { Strand } from "../../model/Feature";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import { Observable, from } from 'rxjs';
/**
 * This service should only be used for the 3D visualziation suite. For all other cases, 
 * TwoBitSource.js works fine
 */

import * as twoBit from'../../vendor/bbi-js/main/twoBit';
import * as  bin from'../../vendor/bbi-js/utils/bin';


export class TwoBitService {
    twoBitPromise: Promise<any>;
    constructor(public url: string) {
        this.twoBitPromise = new Promise((resolve, reject) => {
            twoBit.makeTwoBit(new bin.URLFetchable(url), (twoBitObj: any, error: Error) => {
                if (error) {
                    reject(error);
                }
                resolve(twoBitObj);
            });
        });
    }

    getSequenceInterval$(interval: ChromosomeInterval): Observable<any> {
        const fetch2Bit: Promise<{}> = this.twoBitPromise.then((twoBitObj) => {
            return new Promise((resolve, reject) => {
                twoBitObj.fetch(interval.chr, interval.start + 1, interval.end, (data: any, error: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data)
                    }
                });
            })
        })
        return from(fetch2Bit);
    }
}