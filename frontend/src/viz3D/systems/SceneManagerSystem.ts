import { System } from "../models/System";
import { Entity } from "../models/Entity";
import { SceneManager } from "../models/SceneManager";
import { GameObject } from "../components/GameObject";

export class SceneManagerSystem extends System {
    constructor(public sm: SceneManager) {
        super();
    }

    objectToEntity = new Map<string, Entity>();

    test(e: Entity) {
        return e.hasComponent(GameObject);
    }

    enter(e: Entity) {
        const go = e.getComponent(GameObject);
        this.sm.scene.add(go.transform);
        this.objectToEntity.set(go.transform.uuid, e);
    }
    exit(e: Entity) {
        const go = e.getComponent(GameObject);
        this.sm.scene.remove(go.transform);
        this.objectToEntity.delete(go.transform.uuid);
    }
}