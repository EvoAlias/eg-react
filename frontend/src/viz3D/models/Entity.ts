import { Component } from "./Component";
import { Interval } from "interval-tree2";
import { System } from "./System";
import { ECS } from "./ECS";

export type EntityID = number | string;

export class Entity {
    components: {[name: string]: {}} = {}
    systems: System[] = [];

    // a change in components, which requires a re compute of eligability
    systemsDirty = false;
    transform: THREE.Group;
    ecs: ECS = null;

    constructor(public id: EntityID, components: Component[] = []) {
        for (let c of components) {
            if (typeof c == 'function') {
                const component: any = c;
                if (component.getDefaults) {
                    this.components[component.name] = component.getDefaults()
                } else {
                    this.components[component.name] = Object.assign({}, component.defaults)
                }
            } else {
                const component = c;
                this.components[component.constructor.name] = component;
            }
        }
    }

    addToECS(ecs: ECS) {
        this.ecs = ecs;
        this.setSystemsDirty();
    }

    setSystemsDirty() {
        if (!this.systemsDirty && this.ecs) {
            this.systemsDirty = true;
            
            this.ecs.entitiesSystemsDirty.push(this);
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    removeSystem(system: System) {
        let index = this.systems.indexOf(system);

        if (index !== -1) {
            this.systems.splice(index, 1)
        }
    }

    addComponent<T = {}>(component: Component, data: T) {
        this.components[component.name] = data || {};
        this.setSystemsDirty();
    }

    getComponent<T = {}>(component: Component<T>): T {
        return this.components[component.name] as T;
    }

    hasComponent<T = {}>(component: Component<T>): boolean {
        return !!this.components[component.name]
    }

    updateComponent<T = {}>(comp: Component, data: T) {
        let component = this.components[comp.name]

        if (!component) {
            this.addComponent(comp, data)
        } else {
            let keys = Object.keys(data);

            for (let i = 0, key; key = keys[i]; i += 1) {
                component[key] = data[key];
            }
        }
    }

    updateComponents(componentData: {[name: string]: {}}) {
        let components = Object.keys(componentData);

        for (let component in components) {
            this.updateComponent({ name: component}, componentData[component])
        }
    }

    dispose() {
        for (let system of this.systems) {
            system.removeEntity(this);
        }
    }
}