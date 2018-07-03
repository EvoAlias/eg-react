import { System } from "../models/System";
import { Entity } from "../models/Entity";
import { SceneManager } from "../models/SceneManager";
import { GameObject } from "../components/GameObject";

export class SceneManagerSystem extends System {
    constructor(public sm: SceneManager) {
        super();
    }

    test(e: Entity) {
        return e.hasComponent(GameObject);
    }

    enter(e: Entity) {
        this.sm.scene.add(e.getComponent<GameObject>(GameObject).transform);
    }
    exit(e: Entity) {
        this.sm.scene.remove(e.getComponent<GameObject>(GameObject).transform);
    }
}