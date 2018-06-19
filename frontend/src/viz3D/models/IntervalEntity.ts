import { Entity } from "./Entity";
import { Interval } from "interval-tree2";
import { Component } from "./Component";
import { IntervalComponent } from "../components/IntervalComponent";

export class IntervalEntity extends Entity {
    constructor(public interval: Interval, components: Component[] = []) {

        super(interval.id, [...components, new IntervalComponent(interval)]);
    }
}