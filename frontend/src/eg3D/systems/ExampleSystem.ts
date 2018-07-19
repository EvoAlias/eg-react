import { EGSystem } from "../models/egSystem.model";
import { EGECSComponent } from "../models/egECS.model";

export class ExampleSystem extends EGSystem {

}

export const ExampleSystemConstructor = AFRAME.registerComponent('eg-example', {
    dependencies: [EGECSComponent.name],
    init() {
        const _ = new ExampleSystem(ExampleSystemConstructor, this);
    }
});