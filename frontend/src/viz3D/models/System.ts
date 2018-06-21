import { Entity } from "./Entity";
import { ECS } from "./ECS";

export interface SystemConstructor {
    new (...args: any[]): System
}

export class System {
    entities: Entity[] = [];
    ecs: ECS;

    name = System.name;

    constructor() {
    }

    addToECS(ecs: ECS) {
        this.ecs = ecs;
    }

    addEntity(entity: Entity) {
        entity.addSystem(this)
        this.entities.push(entity);
        this.enter(entity);
    }

    removeEntity(entity: Entity) {
        const index = this.entities.indexOf(entity);

        if (index !== -1) {
            entity.removeSystem(this);
            this.entities.splice(index, 1);
            this.exit(entity);
        }
    }

    updateAll(elapsed: number) {
        this.preUpdate();
        this.update(this.entities, elapsed)
        this.postUpdate();
    }

    init() {}

    preUpdate() {}

    postUpdate() {}

    test(entity: Entity) {
        return false;
    }

    enter(entity: Entity) {}

    exit(entity: Entity) {}

    update(entities: Entity[], elapsed: number) {}

    dispose() {}
}