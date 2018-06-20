import React, { Component } from 'react';
import { ECS } from '../../viz3D/models/ECS';
import { World } from '../../viz3D/systems/World';
import { GenomeTreeSystem } from '../../viz3D/systems/GenomeTree';
import HG19 from '../../model/genomes/hg19/hg19';
import { ChromosomeRenderSystem } from '../../viz3D/systems/ChromosomeRenderSystem';

import * as THREE from 'three';
import { SceneManager } from '../../viz3D/models/SceneManager';
import './VrContext.css';


type State = Readonly<{
    sceneManager: SceneManager;
}>

class VrContext extends Component<State> {
    state: State = null;
    threeRootElement: HTMLCanvasElement;

    componentDidMount() {
        const sceneManager = new SceneManager(this.threeRootElement);
        this.setState({
            sceneManager
        })
    }

    render() {
        return (
            <div className="VrContext">
                <canvas width="800px" height="640px" ref={element => this.threeRootElement = element}></canvas>
            </div>
        )
    }

}