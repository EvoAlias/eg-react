import * as ECS from './egECS.model';
import { EGEntity } from "./egEntity.model";
import { BehaviorSubject } from '../../../node_modules/rxjs';

export interface EGsystemConstructor {
    new (...args: any[]): EGSystem;
}

export class EGSystem {
    entitiesSubject: BehaviorSubject<EGEntity[]> = new BehaviorSubject([]);
    entities$ = this.entitiesSubject.asObservable();
    get entities() {
        return this.entitiesSubject.getValue();
    }
    set entities(entities: EGEntity[]) {
        this.entitiesSubject.next(entities);
    }

    startedSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    started$ = this.startedSubject.asObservable();
    get started() {
        return this.startedSubject.getValue();
    }
    set started(started: boolean) {
        this.startedSubject.next(started);
    }

    tickSubject: BehaviorSubject<number> = new BehaviorSubject(0);
    tick$ = this.tickSubject.asObservable;

    constructor(
        public aframeSystemConstructor: AFrame.ComponentConstructor<AFrame.Component<{}, AFrame.System>>
        , public aframeSystem: AFrame.System) {
        ECS.addSystem(this.aframeSystemConstructor.name, this);
        this.aframeSystem.tick = (timestamp: number, deltaTime: number) => {
            this.tickSubject.next(timestamp);
            this.tick(timestamp, deltaTime);
        }
    }

    get name() {
        return this.aframeSystemConstructor.name;
    }

    addEntity(entity: EGEntity) {
        entity.addSystem(this);
        this.enter(entity);

        const entites = this.entities.slice();
        entites.push(entity);
        this.entities = entites;
    }

    removeEntity(entity: EGEntity) {
        const entities = this.entities.slice();
        const index = entities.indexOf(entity);

        if (index !== -1) {
            entities.splice(index, 1);
            this.exit(entity);
            this.entities = entities;
            entity.removeSystem(this);
        }
    }

    test(entity: EGEntity) {
        return false;
    }

    enter(entity: EGEntity) {
    }

    tick(timestamp: number, deltaTime: number) {

    }

    exit(entity: EGEntity) {

    }
}
