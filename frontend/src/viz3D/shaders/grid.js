import GridVert from '!raw-loader!./grid.vert';
import GridFrag from '!raw-loader!./grid.frag';
import * as THREE from 'three';

export const GridShader = new THREE.ShaderMaterial({
    vertexShader: GridVert,
    fragmentShader: GridFrag
})