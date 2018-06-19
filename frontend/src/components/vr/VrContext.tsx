import React, { Component } from 'react';
import { ECS } from '../../viz3D/models/ECS';
import { World } from '../../viz3D/systems/World';
import { GenomeTreeSystem } from '../../viz3D/systems/GenomeTree';
import HG19 from '../../model/genomes/hg19/hg19';
import { ChromosomeRenderSystem } from '../../viz3D/systems/ChromosomeRenderSystem';

import * as THREE from 'three';



type State = Readonly<{
    ecs: ECS;
}>

class VrContext extends Component<State> {
    state: State = null;
    threeRootElement: HTMLElement;

    componentDidMount() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor("#000000");
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.setState({
            ecs: new ECS([
                new World(scene, camera, renderer),
                new GenomeTreeSystem(HG19),
                new ChromosomeRenderSystem()
            ])
        })
    }

    render() {
        return (
            <canvas>
            </canvas>
        )
    }

}