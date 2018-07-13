import { Component, ComponentConstructor } from "./Component";
import { Interval } from "interval-tree2";
import { System } from "./System";
import { ECS } from "./ECS";
import { GameObject } from "../components/GameObject";

import * as ee from 'event-emitter';

export type EntityID = number | string;

let currentID = 1;

function nextID() {
    return currentID++;
}

export class Entity {
    components: {[name: string]: Component} = {}
    gameObject: GameObject;
    systems: System[] = [];
    // a change in components, which requires a re compute of eligability
    systemsDirty = false;
    ecs: ECS = null;
    id: number;
    
    // From event-emitter
    on: (event: string, listener: (...args: any[]) => void) => void;
    once: (event: string, listener: (...args: any[]) => void) => void;
    off: (event: string, listener: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;

    constructor(components: Array<Component | ComponentConstructor<Component>> = []) {
        this.id = nextID();
        for (const c of components) {
            if (typeof c === 'function') {
                this.components[c.name] = new c();
            } else {
                this.components[c.constructor.name] = c;
            }
        }
        if (!this.hasComponent(GameObject)) {
            this.addComponent(new GameObject())
        }
        this.gameObject = this.getComponent<GameObject>(GameObject);
    }

    addToECS(ecs: ECS) {
        this.ecs = ecs;
        this.setSystemsDirty();
    }

    setSystemsDirty() {
        if (!this.systemsDirty && this.ecs) {
            this.systemsDirty = true;
            this.ecs.setEntityDirty(this);
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    removeSystem(system: System) {
        const index = this.systems.indexOf(system);

        if (index !== -1) {
            this.systems.splice(index, 1)
        }
    }

    addComponent(component: Component) {
        this.components[component.constructor.name] = component;
        this.setSystemsDirty();
    }

    getComponent<T extends Component>(constructor: ComponentConstructor<T>): T {
        return this.components[constructor.name] as T;
    }

    hasComponent<T extends Component>(constructor: ComponentConstructor<T>): boolean {
        return !!this.components[constructor.name]
    }

    removeComponent<T extends Component>(constructor: ComponentConstructor<T>) {
        delete this.components[constructor.name];
        this.setSystemsDirty();
    }

    dispose() {
        for (const system of this.systems) {
            system.removeEntity(this);
        }
    }
}

ee(Entity.prototype);