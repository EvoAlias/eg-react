import { Component } from "../models/Component";


export class GameObject implements Component {
    transform: THREE.Group;
    readonly name = GameObject.name;
    constructor(transform?: THREE.Group) {
        this.transform = transform || new THREE.Group();
    }
}