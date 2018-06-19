import { Component } from "react";
import * as THREE from 'three';


export class GameObject implements Component<GameObject> {
    name = GameObject.name;
    constructor(public transform: THREE.Group) {}
    static getDefaults() {
        return new GameObject(new THREE.Group());
    }
}