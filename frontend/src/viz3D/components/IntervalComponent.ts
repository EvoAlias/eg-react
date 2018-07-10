import { Interval } from "interval-tree2";
import { Component } from "../models/Component";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

export class IntervalComponent implements Component {
    name = IntervalComponent.name;
    constructor(public interval: Interval, public chromosomeInterval: ChromosomeInterval) {}
}