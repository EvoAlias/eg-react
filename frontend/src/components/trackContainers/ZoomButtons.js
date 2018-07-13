import React from 'react';
import PropTypes from 'prop-types';
import ButtonGroup from './ButtonGroup';
import DisplayedRegionModel from '../../model/DisplayedRegionModel';

const ZOOMS = [
    { factor: 2/3, text: "+⅓", title: "Zoom in 1/3-fold" },
    { factor: 4/3, text: "-⅓", title: "Zoom out 1/3-fold" },
    { factor: 2, text: "-1", title: "Zoom out 1-fold" },
    { factor: 5, text: "-5", title: "Zoom out 5-fold" },
];
ZoomButtons.propTypes = {
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,
    onNewRegion: PropTypes.func.isRequired,
}
function ZoomButtons(props) {
    const zoomOut = factor => {
        const newRegion = props.viewRegion.clone().zoom(factor);
        props.onNewRegion(...newRegion.getContextCoordinates());
    };
    const buttons = ZOOMS.map((zoom, index) =>
        <button
            key={index}
            className="btn btn-outline-dark"
            style={{fontFamily: "monospace"}}
            onClick={() => zoomOut(zoom.factor)}
        >
            {zoom.text}
        </button>
    );

    return <ButtonGroup label="Zoom view:" buttons={buttons} />;
}

export default ZoomButtons;
