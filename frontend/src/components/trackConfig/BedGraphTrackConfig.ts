import { NumericalTrackConfig } from './NumericalTrackConfig';
import NumericalTrack from '../trackVis/commonComponents/numerical/NumericalTrack';

import WorkerSource from '../../dataSources/worker/WorkerSource';
import { BedWorker } from '../../dataSources/WorkerTSHook';
import ChromosomeInterval from '../../model/interval/ChromosomeInterval';
import { NumericalFeature } from '../../model/Feature';
import BedRecord from '../../dataSources/bed/BedRecord';

const VALUE_COLUMN_INDEX = 3;

export class BedGraphTrackConfig extends NumericalTrackConfig {
    initDataSource() {
        return new WorkerSource(BedWorker, this.trackModel.url);
    }

    /**
     * Converts raw bed records to NumericalFeatures.  If we cannot parse a numerical value from a
     * record, the resulting NumericalFeature will have a value of 0.
     * 
     * @param {Object[]} data - BED records
     * @return {NumericalFeature[]} numerical features to draw
     */
    formatData(data: BedRecord[]) {
        return data.map(record => {
            const locus = new ChromosomeInterval(record.chr, record.start, record.end);
            const unsafeValue = Number(record[VALUE_COLUMN_INDEX]);
            const value = Number.isFinite(unsafeValue) ? unsafeValue : 0;
            return new NumericalFeature("", locus).withValue(value);
        });
    }

    getComponent() {
        return NumericalTrack;
    }
}
