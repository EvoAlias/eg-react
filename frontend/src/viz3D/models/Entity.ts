import { Component, ComponentConstructor } from "./Component";
import { Interval } from "interval-tree2";
import { System } from "./System";
import { ECS } from "./ECS";

export type EntityID = number | string;

export class Entity {
    components: {[name: string]: Component} = {}
    systems: System[] = [];

    // a change in components, which requires a re compute of eligability
    systemsDirty = false;
    ecs: ECS = null;

    constructor(public id: EntityID, components: (Component | ComponentConstructor<{}>)[] = []) {
        for (let c of components) {
            if (typeof c === 'function') {
                this.components[c.name] = new c();
            } else {
                this.components[c.constructor.name] = c;
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

    dispose() {
        for (let system of this.systems) {
            system.removeEntity(this);
        }
    }
}