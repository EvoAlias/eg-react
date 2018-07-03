import React from 'react';
import PropTypes from 'prop-types';

import annotationTracks from './AnnotationTracks';
import TrackModel from '../../model/TrackModel';
import TreeView from './TreeView';

/**
 * 
 * @param {Object} schemaNode - object from  
 * @param {string} nodeLabel - what to 
 */
function convertOldBrowserSchema(schemaNode, nodeLabel) {
    const isLeaf = schemaNode.hasOwnProperty("name");
    if (isLeaf) {
        // TreeView will pass this object to our custom leaf renderer.
        return new TrackModel(schemaNode); 
    }

    let children = [];
    for (let propName of Object.getOwnPropertyNames(schemaNode)) {
        let propValue = schemaNode[propName];
        if (typeof propValue === "object") {
            children.push(convertOldBrowserSchema(schemaNode[propName], propName))
        }
    }
    return {
        isExpanded: false,
        label: nodeLabel,
        children: children,
    };
}

/**
 * GUI for selecting annotation tracks to add.
 * 
 * @author Silas Hsu
 */
class AnnotationTrackSelector extends React.Component {
    static propTypes = {
        addedTracks: PropTypes.arrayOf(PropTypes.instanceOf(TrackModel)).isRequired,
        onTrackAdded: PropTypes.func,
    }

    static defaultProps = {
        onTrackAdded: () => undefined
    }

    constructor(props) {
        super(props);
        this.data = convertOldBrowserSchema(annotationTracks, "hg19");
        this.nodeToggled = this.nodeToggled.bind(this);
        this.renderLeaf = this.renderLeaf.bind(this);
    }

    nodeToggled(node) {
        node.isExpanded = !node.isExpanded;
        this.setState({});
    }

    renderLeaf(trackModel) {
        if (this.addedTrackSet.has(trackModel)) {
            return <div>{trackModel.label} (ADDED)</div>;
        }
        
        return <div>{trackModel.label} <button onClick={() => this.props.onTrackAdded(trackModel)}>+</button></div>;
    }

    render() {
        this.addedTrackSet = new Set(this.props.addedTracks);
        return (
        <TreeView data={this.data} onNodeToggled={this.nodeToggled} leafRenderer={this.renderLeaf} />
        );
    }
}

export default AnnotationTrackSelector;
