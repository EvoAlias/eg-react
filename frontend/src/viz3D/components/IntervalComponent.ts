import { Interval } from "interval-tree2";
import { Component } from "../models/Component";

export class IntervalComponent implements Component {
    name = IntervalComponent.name;
    constructor(public interval: Interval) {}
}