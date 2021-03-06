import React from 'react';

import Track, { PropsFromTrackContainer } from './commonComponents/Track';
import TrackLegend from './commonComponents/TrackLegend';
import { Sequence } from '../Sequence';

import { ensureMaxListLength } from '../../util';
import { PlacedMergedAlignment, PlacedAlignment, PlacedSequenceSegment }
    from '../../model/alignment/AlignmentViewCalculator';

const FINE_MODE_HEIGHT = 45;
const ROUGH_MODE_HEIGHT = 80;
const RECT_HEIGHT = 15;
const FONT_SIZE = 10;
const PRIMARY_COLOR = 'darkblue';
const QUERY_COLOR = '#B8008A';
const MAX_POLYGONS = 500;

/**
 * Swaps two elements of an array, mutating it
 * 
 * @param {any[]} array - array to modify
 * @param {number} i - first index to swap
 * @param {number} j - second index to swap
 */
function swap(array: any[], i: number, j: number) {
    const temp = array[j];
    array[j] = array[i];
    array[i] = temp;
}

/**
 * 
 * @author Daofeng Li
 * @author Silas Hsu
 */
export class GenomeAlignTrack extends React.Component<PropsFromTrackContainer> {
    constructor(props: PropsFromTrackContainer) {
        super(props);
        this.renderFineAlignment = this.renderFineAlignment.bind(this);
    }

    renderFineAlignment(placement: PlacedAlignment, i: number) {
        const {targetXSpan, targetSegments, querySegments} = placement;
        const [xStart, xEnd] = targetXSpan;
        const targetSequence = placement.visiblePart.getTargetSequence();
        const querySequence = placement.visiblePart.getQuerySequence();

        return <React.Fragment key={i} >
            {renderSequenceSegments(targetSequence, targetSegments, 0, PRIMARY_COLOR)}
            {renderSequenceSegments(querySequence, querySegments, FINE_MODE_HEIGHT - RECT_HEIGHT, QUERY_COLOR)}
        </React.Fragment>;

        function renderSequenceSegments(sequence: string, segments: PlacedSequenceSegment[], y: number, color: string) {
            const nonGaps = segments.filter(segment => !segment.isGap);
            const rects = nonGaps.map((segment, i) =>
                <rect
                    key={i}
                    x={segment.xSpan.start}
                    y={y}
                    width={segment.xSpan.getLength()}
                    height={RECT_HEIGHT}
                    fill={color}
                />
            );
            const letters = nonGaps.map((segment, i) =>
                <Sequence
                    key={i}
                    sequence={sequence.substr(segment.index, segment.length)}
                    xSpan={segment.xSpan}
                    y={y}
                    isDrawBackground={false}
                    height={RECT_HEIGHT}
                />
            );

            return <React.Fragment>
                <line
                    x1={xStart}
                    y1={y + 0.5 * RECT_HEIGHT}
                    x2={xEnd}
                    y2={y + 0.5 * RECT_HEIGHT}
                    stroke={color}
                    strokeDasharray={4}
                />
                {rects}
                {letters}
            </React.Fragment>
        }
    }

    renderRoughAlignment(placement: PlacedMergedAlignment) {
        const {queryFeature, queryXSpan, segments} = placement;
        const queryRectTopY = ROUGH_MODE_HEIGHT - RECT_HEIGHT;
        const queryGenomeRect = <rect
            x={queryXSpan.start}
            y={queryRectTopY}
            width={queryXSpan.getLength()}
            height={RECT_HEIGHT}
            fill={QUERY_COLOR}
            // tslint:disable-next-line:jsx-no-lambda
            onClick={() => alert("You clicked on " + queryFeature.getLocus().toString())}
        />;

        const estimatedLabelWidth = queryFeature.toString().length * FONT_SIZE;
        let label = null;
        if (estimatedLabelWidth < queryXSpan.getLength()) {
            label = <text
                x={0.5 * (queryXSpan.start + queryXSpan.end)}
                y={queryRectTopY + 0.5 * RECT_HEIGHT}
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize={12}
            >
                {queryFeature.getLocus().toString()}
            </text>;
        }

        const segmentPolygons = segments.map((segment, i) => {
            const points = [
                [Math.floor(segment.targetXSpan.start), 0],
                [Math.floor(segment.queryXSpan.start), queryRectTopY],
                [Math.ceil(segment.queryXSpan.end), queryRectTopY],
                [Math.ceil(segment.targetXSpan.end), 0],
            ];
            if (segment.record.queryStrand === '-') {
                swap(points, 1, 2);
            }

            return <polygon
                key={i}
                points={points as any} // Contrary to what Typescript thinks, you CAN pass a number[][].
                fill={QUERY_COLOR}
                fillOpacity={0.5}
                // tslint:disable-next-line:jsx-no-lambda
                onClick={() => alert("You clicked on " + segment.record.getLocus())}
            />;
        });

        return <React.Fragment key={queryFeature.getLocus().toString()} >
            {queryGenomeRect}
            {label}
            {ensureMaxListLength(segmentPolygons, MAX_POLYGONS)}
        </React.Fragment>
    }

    /** 
     * @inheritdoc
     */
    render() {
        const {width, trackModel, alignment} = this.props;
        let height, svgElements;
        if (!alignment) {
            height = FINE_MODE_HEIGHT;
            svgElements = null;
        } else if (alignment.isFineMode) {
            height = FINE_MODE_HEIGHT;
            const drawData = alignment.drawData as PlacedAlignment[];
            svgElements = drawData.map(this.renderFineAlignment);
        } else {
            height = ROUGH_MODE_HEIGHT;
            const drawData = alignment.drawData as PlacedMergedAlignment[];
            svgElements = drawData.map(this.renderRoughAlignment);
        }

        return <Track
            {...this.props}
            visualizer={<svg width={width} height={height} style={{display: "block"}} >{svgElements}</svg>}
            legend={<TrackLegend trackModel={trackModel} height={height} />}
        />
    }
}
