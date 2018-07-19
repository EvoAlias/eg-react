import * as d3 from 'd3';
import { EGSystem } from './egSystem.model';
import { EGEntity } from './egEntity.model';

let entitiesSystemsDirty: number[] = [];
let rootComponent: HTMLElement;
let rootComponent$: d3.Selection<HTMLElement, {}, null, undefined>;
const entityMap = new Map<number, EGEntity>();
const systems = new Map<string, EGSystem>();

export function addEntity(id: number, entity: EGEntity) {
    if (entityMap.has(id)) {
        throw new Error('Attempting to add prexisting entity');
    }
    entityMap.set(id, entity);
}

export function removeEntity(id: number) {
    setEntityDirty(id);
    cleanDirtyEntities();
    entityMap.delete(id);
}

export function addSystem(name: string, system: EGSystem) {
    if (systems.has(name)) {
        throw new Error("Adding same system twice")
    }
    systems.set(name, system);
}

export function getSystem(system: AFrame.SystemConstructor<AFrame.System>) {
    return systems.get(system.name);
}

export function removeSystem(name: string) {
    systems.delete(name);
}

export function setEntityDirty(id: number) {
    entitiesSystemsDirty.push(id);
}

export function cleanDirtyEntities() {
    if (entitiesSystemsDirty.length === 0) {
        return;
    }
    const entities = entitiesSystemsDirty.map(i => entityMap.get(i));

    for (const entity of entities) {
        // Topological sort of systems so children are handled first
        const reversedSystems = Array.from(systems.values()).reverse();
        for (const system of reversedSystems) {
            const test = system.test(entity);
            const index = entity.data.systems.indexOf(system);

            if (index === -1 && test) {
                system.addEntity(entity);
            } else if (index !== -1 && !test) {
                system.removeEntity(entity);
            }
        }
        entity.data.systemsDirty = false;
    }
    entitiesSystemsDirty = [];
}

function tick() {
    if (entitiesSystemsDirty.length) {
        cleanDirtyEntities()
    }
}

interface EGECSSystem extends AFrame.System {
    rootComponent: AFrame.Component;
    root$: d3.Selection<HTMLElement, {}, null, undefined>;

    entities: EGEntity[]; 
    systems: EGSystem[];

    setRootComponent: (root: AFrame.Component) => void;   
}

function setRootComponent(root: AFrame.Component) {
    rootComponent = root.el;
    rootComponent$ = d3.select(root.el);
}

export const EGECSComponent = AFRAME.registerComponent('eg-ecs', {
    init() {
        setRootComponent(this);
    }
})
