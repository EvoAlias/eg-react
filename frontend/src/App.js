import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ActionCreators } from './AppState';

import { DrawerMenu } from './DrawerMenu';
import GenomePicker from './components/GenomePicker';
import GenomeNavigator from './components/genomeNavigator/GenomeNavigator';
import TrackContainer from './components/trackContainers/TrackContainer';
import withCurrentGenome from './components/withCurrentGenome';
import { BrowserScene } from './components/vr/BrowserScene';
import ErrorBoundary from './components/ErrorBoundary';

import DisplayedRegionModel from './model/DisplayedRegionModel';
import TrackModel from './model/TrackModel';
import { VrContext } from './components/vr/VrContext';

import './App.css';

function mapStateToProps(state) {
    return {
        viewRegion: state.viewRegion,
        tracks: state.tracks,
    };
}

const callbacks = {
    onNewViewRegion: ActionCreators.setViewRegion,
    onTracksChanged: ActionCreators.setTracks,
}

class App extends React.Component {
    static propTypes = {
        genomeConfig: PropTypes.object,
        viewRegion: PropTypes.instanceOf(DisplayedRegionModel),
        tracks: PropTypes.arrayOf(PropTypes.instanceOf(TrackModel)),
        onNewViewRegion: PropTypes.func,
        onTracksChanged: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this.state = {
            isShowing3D: false,
        };
        this.addTracks = this.addTracks.bind(this);
        this.removeTrack = this.removeTrack.bind(this);
        this.toggle3DScene = this.toggle3DScene.bind(this);
    }

    addTracks(tracks) {
        const newTracks = this.props.tracks.concat(tracks);
        this.props.onTracksChanged(newTracks);
    }

    removeTrack(indexToRemove) {
        let newTracks = this.props.tracks.filter((track, index) => index !== indexToRemove);
        this.props.onTracksChanged(newTracks);
    }

    toggle3DScene() {
        this.setState(prevState => {return {isShowing3D: !prevState.isShowing3D}});
    }

    render() {
        return (
            <VrContext/>
        )
        // const {genomeConfig, viewRegion, tracks, onNewViewRegion} = this.props;
        // if (!genomeConfig) {
        //     return <div className="container-fluid"><GenomePicker /></div>;
        // }

        // return (
        // <div className="container-fluid">
        //     <GenomeNavigator selectedRegion={viewRegion} onRegionSelected={onNewViewRegion} />
        //     <TrackContainer />
        //     <TrackManager
        //         addedTracks={tracks}
        //         onTracksAdded={this.addTracks}
        //         onTrackRemoved={this.removeTrack}
        //     />
        //     <hr/>
        //     <button onClick={() => this.setState({isShowingRegionSetUI: !this.state.isShowingRegionSetUI})}>
        //         Show/hide region set config
        //     </button>
        //     {this.state.isShowingRegionSetUI ? <RegionSetSelector genome={genomeConfig.genome} /> : null}
        // </div>
        // );
    }
}

export default connect(mapStateToProps, callbacks)(withCurrentGenome(App));
