import * as ECS from './egECS.model';
import { EGSystem } from './egSystem.model';
import { System } from '../../viz3D/models/System';

let currentID = 1;

function nextID() {
    return currentID++;
}

export interface EGEntity extends AFrame.Component {
    data: {
        'eg-id': number,
        systemsDirty: boolean,
        systems: EGSystem[],
    },
    getID: () => number;
    addSystem: (system: EGSystem) => void;
    removeSystem: (system: EGSystem) => void;
    setSystemsDirty: () => void;
    hasComponent: <T>(
        component: AFrame.ComponentConstructor<AFrame.Component<T, AFrame.System>>
    ) => void;
    getComponent: <T>(
        component: AFrame.ComponentConstructor<AFrame.Component<T, AFrame.System>>
    ) => AFrame.Component<T, AFrame.System>;
}

export const EGEntityComponent = AFRAME.registerComponent<EGEntity>('eg-entity', {
    dependencies: [ECS.EGECSComponent.name],
    schema: {
        'eg-id': {
            type: 'int'
        },
        systemsDirty: {
            type: 'boolean'
        }
    },
    init() {
        this.el.setAttribute('eg-id', this.el.getAttribute('eg-id') || nextID )
        ECS.addEntity(this.getID(), this);
    },
    remove() {
        ECS.removeEntity(this.getID());
    },
    getID(): number {
        return this.el.getAttribute('eg-id');
    },
    setSystemsDirty() {
        if (!this.data.systemsDirty) {
            this.data.systemsDirty = true;
            ECS.setEntityDirty(this.getID());
        }
    },
    hasComponent<T>(component: AFrame.ComponentConstructor<AFrame.Component<T, AFrame.System>>) {
        return !!this.el.components[component.name];
    },
    getComponent<T>(component: AFrame.ComponentConstructor<AFrame.Component<T, AFrame.System>>) {
        return this.el.components[component.name];
    },
    addSystem(system: EGSystem) {
        this.data.systems.push(system)
    },
    removeSystem(system: EGSystem) {
        const index = this.data.systems.indexOf(system);

        if (index !== -1) {
            this.data.systems.splice(index, 1)
        }
    }
})