import React from 'react';
import PropTypes from 'prop-types';
import CustomHubAdder from './CustomHubAdder';
import HubTable from './HubTable';
import HubTrackTable from './HubTrackTable';
import TrackModel from '../../model/TrackModel';

import './HubPane.css';

/**
 * The window containing UI for loading public track hubs, loading custom hubs, and adding tracks from hubs.
 * 
 * @author Silas Hsu
 */
class HubPane extends React.PureComponent {
    static propTypes = {
        addedTracks: PropTypes.arrayOf(PropTypes.instanceOf(TrackModel)),
        onTracksAdded: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            availableTracks: [],
            isHubTableVisible: false,
            isCustomHubInputVisible: false,
        };
        this.addToAvailableTracks = this.addToAvailableTracks.bind(this);
        this.toggleHubTable = this.toggleHubTable.bind(this);
        this.toggleCustomHubInput = this.toggleCustomHubInput.bind(this);
    }

    /**
     * Adds a list of tracks to the list of all tracks available from a hub.
     * 
     * @param {TrackModel[]} newTracks - additions to the list of all tracks available from a hub
     * @param {boolean} makeVisible - whether to also add the tracks to the visible (added) track list
     */
    addToAvailableTracks(newTracks, makeVisible=false) {
        this.setState({availableTracks: this.state.availableTracks.concat(newTracks)});
        if (makeVisible) {
            this.props.onTracksAdded(newTracks)
        }
    }

    /**
     * Sets state to toggle the visibility of the public track hub list.
     */
    toggleHubTable() {
        this.setState({isHubTableVisible: !this.state.isHubTableVisible});
    }

    /**
     * Sets state to toggle the visibility of the form to load a custom hub
     */
    toggleCustomHubInput() {
        this.setState({isCustomHubInputVisible: !this.state.isCustomHubInputVisible});
    }

    /**
     * Renders:
     *     Conditionally, public track hub list
     *     Conditionally, form to load a custom hub
     *     Buttons to show and hide the above
     *     If there are any tracks from hubs, a track list
     * 
     * @return {JSX.Element} the element to render
     * @override
     */
    render() {
        return (
        <div>
            <button
                className={!this.state.isHubTableVisible ? "btn btn-primary" : "btn btn-light"}
                onClick={this.toggleHubTable}
            >
                {!this.state.isHubTableVisible ? "Show public hubs" : "Hide public hubs"}
            </button>

            <button className="btn btn-light" onClick={this.toggleCustomHubInput}>Custom hub...</button>
            {
            this.state.isCustomHubInputVisible &&
                <CustomHubAdder onTracksAdded={tracks => this.addToAvailableTracks(tracks, true)} />
            }
            {this.state.isHubTableVisible && <HubTable onHubLoaded={this.addToAvailableTracks} />}
            {
            this.state.availableTracks.length > 0 ?
                <HubTrackTable
                    tracks={this.state.availableTracks}
                    addedTracks={this.props.addedTracks}
                    onTrackAdded={track => this.props.onTracksAdded([track])}
                /> :
                <p>No tracks from data hubs yet.  Load a hub first.</p>
            }
        </div>
        );
    }
}

export default HubPane;
