import React from 'react';
import PropTypes from 'prop-types';
import { MIN_VIEW_REGION_SIZE } from '../../AppState';

import MainPane from './MainPane';
import TrackRegionController from './TrackRegionController';
import GeneSearchBox from './GeneSearchBox';

import DisplayedRegionModel from '../../model/DisplayedRegionModel';
import eglogo from '../../images/eglogo.jpg';

/**
 * A navigator that allows users to scroll around the genome and select what region for tracks to display.
 * 
 * @author Silas Hsu
 */
class GenomeNavigator extends React.Component {
    static propTypes = {
        /**
         * The region that the tracks are displaying.
         */
        selectedRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,

        /**
         * Called when the user selects a new region to display.  Has the signature
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the selected interval
         *         `newEnd`: the nav context coordinate of the end of the selected interval
         */
        onRegionSelected: PropTypes.func
    };

    static defaultProps = {
        onRegionSelected: () => undefined
    };

    /**
     * Binds functions, and also forks that view region that was passed via props.
     */
    constructor(props) {
        super(props);
        this.state = {
            viewRegion: new DisplayedRegionModel(this.props.selectedRegion.getNavigationContext()),
            isShowingNavigator: false
        };

        this.toggleNavigator = this.toggleNavigator.bind(this);
        this.zoom = this.zoom.bind(this);
        this.setNewView = this.setNewView.bind(this);
        this.zoomSliderDragged = this.zoomSliderDragged.bind(this);
    }

    /**
     * Resets the view region if a new one is received.
     * 
     * @param {any} nextProps - new props that this component will receive
     * @override
     */
    componentWillReceiveProps(nextProps) {
        const thisNavContext = this.state.viewRegion.getNavigationContext();
        const nextNavContext = nextProps.selectedRegion.getNavigationContext();
        if (thisNavContext !== nextNavContext) {
            this.setState({viewRegion: new DisplayedRegionModel(nextNavContext)});
        }
    }

    toggleNavigator() {
        this.setState(prevState => {return {isShowingNavigator: !prevState.isShowingNavigator}});
    }

    /**
     * Copies this.state.viewRegion, mutates it by calling `methodName` with `args`, and then calls this.setState().
     * 
     * @param {string} methodName - the method to call on the model
     * @param {any[]} args - arguments to provide to the method
     */
    _setModelState(methodName, args) {
        let regionCopy = this.state.viewRegion.clone();
        regionCopy[methodName].apply(regionCopy, args);
        if (regionCopy.getWidth() < MIN_VIEW_REGION_SIZE) {
            return;
        }
        this.setState({viewRegion: regionCopy});
    }

    /**
     * Wrapper for calling zoom() on the view model.
     * 
     * @param {number} amount - amount to zoom
     * @param {number} [focusPoint] - focal point of the zoom
     * @see DisplayedRegionModel#zoom
     */
    zoom(amount, focusPoint) {
        this._setModelState("zoom", [amount, focusPoint]);
    }

    /**
     * Wrapper for calling setRegion() on the view model
     * 
     * @param {number} newStart - start nav context coordinate
     * @param {number} newEnd - end nav context coordinate
     * @see DisplayedRegionModel#setRegion
     */
    setNewView(newStart, newEnd) {
        this._setModelState("setRegion", [newStart, newEnd]);
    }

    /**
     * Zooms the view to the right level when the zoom slider is dragged.
     * 
     * @param {React.SyntheticEvent} event - the event that react fired when the zoom slider was changed
     */
    zoomSliderDragged(event) {
        let targetRegionSize = Math.exp(event.target.value);
        let proportion = targetRegionSize / this.state.viewRegion.getWidth();
        this._setModelState("zoom", [proportion]);
    }

    /**
     * @inheritdoc
     */
    render() {
        return (
            <div className="container-fluid" style={{borderBottom: "1px solid lightgrey"}}>
                <nav className="navbar">
                    <div className="row">
                        <div className="col-sm">
                            <img src={eglogo} width="400px" alt="eg logo"/>
                        </div>
                       
                        <div className="col-md">
                            <TrackRegionController
                                selectedRegion={this.props.selectedRegion}
                                onRegionSelected={this.props.onRegionSelected}
                            />
                        </div>
                        <div className="col-md">
                            <GeneSearchBox
                                navContext={this.props.selectedRegion.getNavigationContext()}
                                onRegionSelected={this.props.onRegionSelected}
                            />
                        </div>
                        <div className="col-sm">
                            <label>
                                <span style={{marginRight: "1ch"}} >Show genome-wide navigator</span>
                                <input type="checkbox" checked={this.state.isShowingNavigator} onChange={this.toggleNavigator} />
                            </label>
                            {
                            this.state.isShowingNavigator &&
                                <ul>
                                    <li>Left mouse drag: select</li>
                                    <li>Right mouse drag: pan</li>
                                    <li>Mousewheel: zoom</li>
                                </ul>
                            }
                        </div>
                    </div>
                </nav>
                {
                this.state.isShowingNavigator &&
                    <MainPane
                        viewRegion={this.state.viewRegion}
                        selectedRegion={this.props.selectedRegion}
                        onRegionSelected={this.props.onRegionSelected}
                        onNewViewRequested={this.setNewView}
                        onZoom={this.zoom}
                    />
                }
            </div>
        );
    }
}

export default GenomeNavigator;
