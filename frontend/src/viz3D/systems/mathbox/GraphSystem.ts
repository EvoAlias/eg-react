import { System } from "../../models/System";
import { Entity } from "../../models/Entity";
import { GraphComponent } from "../../components/mathbox/GraphComponent";
import { SceneManager } from "../../models/SceneManager";
import { SceneManagerSystem } from "../SceneManagerSystem";

export class GraphSystem extends System {
    sm: SceneManager;

    test(e: Entity) {
        return e.hasComponent(GraphComponent);
    }

    init() {
        this.sm = this.ecs.getSystem<SceneManagerSystem>(SceneManagerSystem).sm;
        // create an entity
        this.ecs.addEntity(new Entity([GraphComponent]))
    }

    enter(e: Entity) {
        
    }
}