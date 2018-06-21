import { Entity } from "./Entity";
import { System, SystemConstructor } from "./System";
import * as uuid from 'uuid/v4';

// TODO watch changes on entity system dirty

export class ECS {
    entities: Entity[] = []
    entitiesSystemsDirty: Entity[] = []
    systems: System[] = []
    
    updateCounter = 0;
    lastUpdate = performance.now();

    constructor(systems: System[] = []) {
        this.systems = systems;
        this.systems.forEach(s => this.addSystem(s))
    }

    getEntityById(id: number) {
        return this.entities.find(e => e.id === id);
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
        entity.addToECS(this);
    }

    removeEntity(entity: Entity): Entity {
        const index = this.entities.indexOf(entity);
        let entityRemoved = null;

        if (index !== -1) {
            entityRemoved = this.entities[index];
            entity.dispose();
            this.removeEntityIfDirty(entityRemoved);
            this.entities.splice(index, 1);
        }
        return entityRemoved;
    }

    removeEntityById(entityId: number): Entity {
        const index = this.entities.findIndex(e => e.id === entityId);
        if (index !== -1) {
            const entity = this.entities[index];
            entity.dispose()
            this.removeEntityIfDirty(entity);

            this.entities.splice(index, 1)
            return entity
        }
        return null;
    }

    removeEntityIfDirty(entity: Entity) {
        const index = this.entitiesSystemsDirty.indexOf(entity);

        if (index !== -1) {
            this.entitiesSystemsDirty.splice(index, 1)
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
        system.addToECS(this);
        for (const entity of this.entities) {
            if (system.test(entity)) {
            system.addEntity(entity);
            }
        }
        system.init();
    }

    getSystem<T extends System>(system: SystemConstructor) {
        return this.systems.find(s => s.constructor === system) as T;
    }

    removeSystem(system: System) {
        const index = this.systems.indexOf(system);

        if (index !== -1) {
            this.systems.splice(index, 1);
            system.dispose()
        }
    }

    cleanDirtyEntities() {
        for (const entity of this.entitiesSystemsDirty) {
            for (const system of this.systems) {
                const index = entity.systems.indexOf(system);
                const test = system.test(entity);

                if (index === -1 && test) {
                    system.addEntity(entity);
                } else if (index !== -1 && !test) {
                    system.removeEntity(entity);
                }
            }
            entity.systemsDirty = false;
        }
        this.entitiesSystemsDirty = [];
    }

    update() {
        const now = performance.now()
        const elapsed = now - this.lastUpdate;

        for (const system of this.systems) {
            if (this.entitiesSystemsDirty.length) {
                this.cleanDirtyEntities();
            }
            system.updateAll(elapsed)
        }

        this.updateCounter += 1;
        this.lastUpdate = now;
    }

    nextID() {
        return uuid()
    }
}  