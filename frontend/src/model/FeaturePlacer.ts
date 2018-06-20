import DisplayedRegionModel from './DisplayedRegionModel';
import { Feature } from './Feature';
import OpenInterval from './interval/OpenInterval';
import LinearDrawingModel from './LinearDrawingModel';
import NavigationContext from './NavigationContext';
import FeatureInterval from './interval/FeatureInterval';

/**
 * Draw information for a Feature
 */
export interface PlacedFeature {
    feature: Feature; // The feature
    /**
     * The location of the feature in navigation context coordinates.  The programmer should not assume that this
     * interval's length is equal to the feature's length, because some parts of the feature might not exist in the
     * navigation context (suppose that the context only contains chr1:50-100 but the feature is chr1:0-200).
     */
    contextLocation: OpenInterval;
    xLocation: OpenInterval; // Horizontal location the feature should occupy
}

export interface PlacedSegment {
    segment: FeatureInterval; // The segment
    /**
     * Location of the segment in nav context coordiantes.  See note for contextLocation in PlacedFeature for important
     * details.
     */
    contextLocation: OpenInterval;
    offsetRelativeToFeature: number; // Location of the context location relative to the feature's start
}

export class FeaturePlacer {
    /**
     * Computes context and draw locations for a list of features.  There may be a different number of placed features
     * than input features, as a feature might map to several different nav context coordinates, or a feature might
     * not map at all.
     * 
     * @param {Feature[]} features - features for which to compute draw locations
     * @param {DisplayedRegionModel} viewRegion - region in which to draw
     * @param {number} width - width of visualization
     * @return {PlacedFeature[]} draw info for the features
     */
    placeFeatures(features: Feature[], viewRegion: DisplayedRegionModel, width: number): PlacedFeature[] {
        const drawModel = new LinearDrawingModel(viewRegion, width);
        const navContext = viewRegion.getNavigationContext();

        const placements = [];
        for (const feature of features) {
            for (const location of feature.computeNavContextCoordinates(navContext)) {
                const startX = Math.max(0, drawModel.baseToX(location.start));
                const endX = Math.min(drawModel.baseToX(location.end), width - 1);
                if (startX < endX) {
                    placements.push({
                        feature,
                        contextLocation: location,
                        xLocation: new OpenInterval(startX, endX)
                    });
                }
            }
        }

        return placements;
    }

    /**
     * Gets the context location for feature segments, assuming that all segments are part of the same feature.  To
     * disambiguate when a segment maps to multiple context locations, this method also requires the context location of
     * the parent feature, which can be obtained from `placeFeatures()`.  This effectively puts a limit on where
     * segments may map; there may be fewer placed segments than input segments.
     * 
     * @param {FeatureInterval[]} segments - segments for which to get context locations
     * @param {NavigationContext} navContext - navigation context to map to
     * @param {OpenInterval} contextLocationOfFeature - context location of the feature from which the segments came
     * @return {PlacedSegment[]} placed segments
     */
    placeFeatureSegments(segments: FeatureInterval[], navContext: NavigationContext,
        contextLocationOfFeature: OpenInterval): PlacedSegment[]
    {
        /**
         * Convert mapped context location to genomic coordinates, so we can directly compare it to the segment's locus.
         * This expression assumes the mapped location only spans one chromosome, which it should, because the feature
         * should only span one chromosome as well.
         */
        const locusOfContextLocation = navContext
            .convertBaseToFeatureCoordinate(contextLocationOfFeature.start) 
            .getGenomeCoordinates();
        const results = [];
        for (const segment of segments) {
            // Distance of the segment's start from the mapped locus's start.  A positive value means the context
            // location of the segment starts after the context location of the feature.
            const distFromParentLocation = segment.getGenomeCoordinates().start - locusOfContextLocation.start;
            // Context location of the start of the segment
            const contextStart = contextLocationOfFeature.start + distFromParentLocation;
            const unsafeContextLocation = new OpenInterval(contextStart, contextStart + segment.getLength());
            const contextLocation = unsafeContextLocation.getOverlap(contextLocationOfFeature);
            if (contextLocation) {
                results.push({
                    segment,
                    contextLocation,
                    offsetRelativeToFeature: segment.relativeStart + Math.max(0, distFromParentLocation)
                });
            }
        }
        return results;
    }
}
