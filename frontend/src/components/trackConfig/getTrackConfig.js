import { TrackConfig } from './TrackConfig';
import { BamTrackConfig } from './BamTrackConfig';
import { BedTrackConfig } from './BedTrackConfig';
import { BigBedTrackConfig } from './BigBedTrackConfig';
import { BedGraphTrackConfig } from './BedGraphTrackConfig';
import { BigWigTrackConfig } from './BigWigTrackConfig';
import { GeneAnnotationTrackConfig } from './GeneAnnotationTrackConfig';
import { HicTrackConfig } from './HicTrackConfig';
import { MethylCTrackConfig } from './MethylCTrackConfig';
import { RepeatMaskerTrackConfig } from './RepeatMaskerTrackConfig';
import { RulerTrackConfig } from './RulerTrackConfig';

const TYPE_NAME_TO_CONFIG = {
    "bam": BamTrackConfig,
    "bed": BedTrackConfig,
    "bedgraph": BedGraphTrackConfig,
    "bigbed": BigBedTrackConfig,
    "bigwig": BigWigTrackConfig,
    "hic": HicTrackConfig,
    "geneannotation": GeneAnnotationTrackConfig,
    "methylc": MethylCTrackConfig,
    "repeatmasker": RepeatMaskerTrackConfig,
    "ruler": RulerTrackConfig,
};
const DefaultConfig = TrackConfig;

if (process.env.NODE_ENV !== "production") { // Check if all the subtypes are clean
    for (let subtypeName in TYPE_NAME_TO_CONFIG) {
        if (subtypeName.toLowerCase() !== subtypeName) {
            throw new TypeError(`Type names may not contain uppercase letters.  Offender: "${subtypeName}"`);
        }
    }
}

/**
 * Gets the appropriate TrackConfig from a trackModel.  This function is separate from TrackConfig because it would
 * cause a circular dependency.
 * 
 * @param {TrackModel} trackModel - track model
 * @return {TrackConfig} renderer for that track model
 */
export function getTrackConfig(trackModel) {
    let type = trackModel.type || trackModel.filetype || "";
    type = type.toLowerCase();
    const TrackConfigSubtype = TYPE_NAME_TO_CONFIG[type];
    if (TrackConfigSubtype) {
        return new TrackConfigSubtype(trackModel)
    } else {
        return new DefaultConfig(trackModel);
    }
}
