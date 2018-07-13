import { Entity } from "./Entity";
import { System, SystemConstructor } from "./System";
import * as uuid from 'uuid/v4';
import { interval, BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, debounce } from "rxjs/operators";

// TODO watch changes on entity system dirty

export class ECS {
    entities: Entity[] = [];
    entitiesSystemsDirty = new BehaviorSubject<Entity[]>([]);
    entitiesSystemsDirty$: Observable<Entity[]> = this.entitiesSystemsDirty.asObservable();
    systems: System[] = [];
    
    fixedUpdate$ = interval(34);
    renderSource = new Subject<number>();
    render$ = this.renderSource.asObservable();
    
    updateCounter = 0;
    lastUpdate = performance.now();

    constructor(systems: System[], public services: any[]) {
        this.systems = systems;
        // Tell the system that this is the ecs
        this.systems.forEach(s => s.addToECS(this));
        // Initialize systems one by one
        this.systems.forEach(s => s.init());
        // Tell all systems that all other systems are initialized
        this.systems.forEach(s => s.onECSInit());
        // Add entities to the systems.
        this.systems.forEach(s => {
            for (const entity of this.entities) {
                if (s.test(entity)) {
                    s.addEntity(entity);
                }
            }
        });
        // Check for updates every fixed update
        this.entitiesSystemsDirty$.pipe(
            // Ignore cases when everything is clean
            filter(entities => entities.length > 0),
            // ratelimit with fixed update
            debounce(() => this.fixedUpdate$)
        ).subscribe(() => {
            this.cleanDirtyEntities();
        })
    }

    getEntityById(id: number) {
        return this.entities.find(e => e.id === id);
    }

    addEntity(entity: Entity) {
        const exist = this.entities.find(e => e.id === entity.id);
        if (exist) {
            return;
        }
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

    setEntityDirty(entity: Entity) {
        this.entitiesSystemsDirty.next([...this.entitiesSystemsDirty.getValue(), entity]);
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
        const entities = this.entitiesSystemsDirty.getValue();
        const index = entities.indexOf(entity);

        if (index !== -1) {
            entities.splice(index, 1);
            this.entitiesSystemsDirty.next(entities);
        }
    }

    getService<T = {}>(service: any) {
        return this.services.find(s => s.constructor === service) as T;
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
        const entities = this.entitiesSystemsDirty.getValue();
        if (entities.length === 0) {
            return;
        }
        // Clear entities system Dirty
        this.entitiesSystemsDirty.next([]);
        // update
        for (const entity of entities) {
            // reversed systems to preserve order;
            const reversedSystems = this.systems.reverse();
            for (const system of reversedSystems) {
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
    }

    fixedUpdate() {
        // const now = performance.now()
        // const elapsed = now - this.lastUpdate;
        // for (const system of this.systems) {
        //     if (this.entitiesSystemsDirty.length) {
        //         this.cleanDirtyEntities();
        //     }
        // }
        // this.updateCounter += 1;
        // this.lastUpdate = now;
    }

    nextID() {
        return uuid()
    }
}  