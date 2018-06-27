import { Entity } from "./Entity";
import { ECS } from "./ECS";
import { BehaviorSubject } from "rxjs";

export interface SystemConstructor {
    new (...args: any[]): System
}

export class System {
    ecs: ECS;
    name = System.name;

    entitiesSubject: BehaviorSubject<Entity[]> = new BehaviorSubject([]);
    entities$ = this.entitiesSubject.asObservable();

    constructor() {
    }

    addToECS(ecs: ECS) {
        this.ecs = ecs;
    }

    addEntity(entity: Entity) {
        entity.addSystem(this)
        this.enter(entity);
        // Make a copy of the array for change detection.
        const entities = this.entitiesSubject.getValue().slice();
        entities.push(entity);
        this.entitiesSubject.next(entities);
    }

    removeEntity(entity: Entity) {
        const entities = this.entitiesSubject.getValue().slice();
        const index = entities.indexOf(entity);

        if (index !== -1) {
            entity.removeSystem(this);
            entities.splice(index, 1);
            this.exit(entity);
            this.entitiesSubject.next(entities);
        }
    }

    fixedUpdateAll(elapsed: number) {
        this.preFixedUpdate();
        this.fixedUpdate(this.entitiesSubject.getValue(), elapsed)
        this.postFixedUpdate();
    }


    /**
     * Called before onECSInit. Used for resource allocation.
     *
     * @memberof System
     */
    init() {}

    onECSInit() {

    }

    preFixedUpdate() {}

    postFixedUpdate() {}

    test(entity: Entity) {
        return false;
    }

    enter(entity: Entity) {}

    exit(entity: Entity) {}

    fixedUpdate(entities: Entity[], elapsed: number) {}

    dispose() {}
}