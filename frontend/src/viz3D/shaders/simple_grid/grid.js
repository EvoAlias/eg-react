import SimpleGridVert from '!raw-loader!./grid.vert';
import SimpleGridFrag from '!raw-loader!./grid.frag';
import * as THREE from 'three';

export const SimpleGridShader = new THREE.ShaderMaterial({
    vertexShader: SimpleGridVert,
    fragmentShader: SimpleGridFrag
})