import WorkerRunnableSource from "../worker/WorkerRunnableSource";
import BedSourceWorker from "./BedSourceWorker";
import JSON5 from 'json5';

const ROUGH_MODE_LENGTH = 10;

export class GenomeAlignmentWorker extends WorkerRunnableSource {
    constructor(url) {
        super();
        this.bedSourceWorker = new BedSourceWorker(url, Infinity);
    }

    async getData(loci, basesPerPixel) {
        const bedRecords = await this.bedSourceWorker.getData(loci);
        bedRecords.map(record => {
            let data = JSON5.parse('{' + record[3] + '}');
            if (basesPerPixel >= ROUGH_MODE_LENGTH) {
                data.genomealign.targetseq = null;
                data.genomealign.queryseq = null;
            }
            record[3] = data;
        })
        return bedRecords;
    }
}
