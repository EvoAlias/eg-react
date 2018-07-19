declare module 'interval-tree2' {
    export class Interval {
        start: number;
        end: number;
        id: number;
        // gets the center of the interval
        center(): number;
    }

    export class Node {
        ends: SortedList<Interval>
        left?: Node;
        right?: Node;
        starts: SortedList<Interval>
        
        count(): number;
        endPointSearch(val: number): Interval[];
        getAllIntervals(): Interval[];
        insert(interval: Interval): void;
        remove(interval: Interval, list: SortedList): void;
        startPointSearch(val: number): Interval[];
    }

    export class Point {

    }

    export class SortedList<T = {}> extends Array<T> {
        compareKey: number;
        bsearch(val: T): number;
        firstPositionOf(val: T): number;
        insert(val: T): number;
        lastPositionOf(val: T): number;
        max(): number;
        min(): number;
        remove(pos: number): this;
    }

    class IntervalTree {
        idCandidate: number // unique id candidate of interval without id to be added next time
        intervalsById: {[id: number]: Interval};
        nodesByCenter: {[center: number]: Node};
        nodesById: {[id: number]: Node};
        pointTree: SortedList<Point>;
        root: Node;

        constructor(center: number);

        add(start: number, end: number, id?: number): Interval;
        pointSearch(val: number, node?: Node): Interval[];
        rangeSearch(start: number, end: number): Interval[];
        search(start: number, end: number): Interval[];
        remove(id: number): void;
    }
    export default IntervalTree
}
