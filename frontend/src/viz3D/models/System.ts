import { Entity } from "./Entity";
import { ECS } from "./ECS";

export class System {
    frequency: number;
    entities: Entity[];
    ecs: ECS;

    name = System.name;

    constructor(frequency = 1) {
        // how many updates before system gets run
        this.frequency = frequency;
    }

    addToECS(ecs: ECS) {
        this.ecs = ecs;
        this.init();
    }

    addEntity(entity: Entity) {
        entity.addSystem(this)
        this.entities.push(entity);
        this.enter(entity);
    }

    removeEntity(entity: Entity) {
        let index = this.entities.indexOf(entity);

        if (index !== -1) {
            entity.removeSystem(this);
            this.entities.splice(index, 1);
            this.exit(entity);
        }
    }

    updateAll(elapsed: number) {
        this.preUpdate();
        for (let entity of this.entities) {
            this.update(entity, elapsed)
        }
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

    update(entity: Entity, elapsed: number) {}

    dispose() {}
}