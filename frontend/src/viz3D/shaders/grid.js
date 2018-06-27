import GridVert from '!raw-loader!./grid.vert';
import GridFrag from '!raw-loader!./grid.frag';
import * as THREE from 'three';

console.log(GridFrag, GridVert);

export const GridShader = new THREE.ShaderMaterial({
    vertexShader: GridVert,
    fragmentShader: GridFrag
})