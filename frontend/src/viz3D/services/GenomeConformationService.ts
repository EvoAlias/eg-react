import * as THREE from 'three';
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

export class GeneConformationService {
    getPositionAt(bp: number): THREE.Vector3 {
        // fake with a helix
        const radius = 2;
        const frequency = 1 / 1000; // 1000 bp per turn
        return new THREE.Vector3(
            bp,
            radius * Math.cos(frequency * bp),
            radius * Math.sin(frequency * bp)
        )
    }
}