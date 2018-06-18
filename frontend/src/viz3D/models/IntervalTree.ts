import * as SortedList from 'sortedlist';

type IntervalKey =  number;

type Range = [number, number];

interface IntervalResult {
    id: number;
    range: Range;
    rate1?: number;
    rate2?: number;
}

class Interval<T> {
    start: number;
    end: number;
    constructor(public range: Range, public id: number, public data: T) {
        this.start = range[0];
        this.end = range[0];

        if (typeof this.start != 'number' || typeof this.end != 'number') {
            throw new Error(`start, end must be number. start: ${this.start}, end: ${this.end}`)
        }

        if (this.start >= this.end) {
            throw new Error(`start must be smaller than end. start: ${this.start}, end: ${this.end}`)
        }
    }

    result(start?: number, end?: number): IntervalResult {
        const ret = {
            id: this.id,
            range: this.range,
            rate1: 0,
            rate2: 0,
        };
        if (typeof start == 'number' && typeof end == 'number') {
            const left = Math.max(this.start, start);
            const right = Math.min(this.end, end);
            const lapLn = right - left;
            ret.rate1 = lapLn / (end - start);
            ret.rate2 = lapLn / (this.end - this.start);
        }
        return ret;
    }
}

class IntervalNode<T> {
    idx: IntervalKey;
    left?: IntervalNode<T>;
    right?: IntervalNode<T>;
    starts: SortedList<Interval<T>>;
    ends: SortedList<Interval<T>>;
    constructor(center: number, tree: IntervalTree<T>) {
        this.idx = center;
        this.starts = new SortedList({
            compare(a, b) {
                if (a == null) return -1;
                if (b == null) return 1;
                const c = a.start - b.start;
                return (c > 0) ? 1 : (c == 0) ? 0 : -1;
            }
        });
        this.ends = new SortedList({
            compare(a, b) {
                if (a == null) return -1;
                if (b == null) return 1;
                const c = a.end - b.end;
                return (c > 0) ? 1 : (c == 0) ? 0 : -1;
            }
        }); 
    }
    insert(interval: Interval<T>) {
        this.starts.insert(interval);
        this.ends.insert(interval);
    }
}

class IntervalTree<T> {
    intervalHash: {[id: number]: Interval<T>};
    pointTree: SortedList;
    root: IntervalNode<T>;

    private _autoIncrement = 0;

    constructor(center: number) {
        this.intervalHash = {};
        this.pointTree = new SortedList<[number, number]>({
            compare(a, b) {
                if (a == null) return -1;
                if (b == null) return 1;
                const c = a[0] - b[0];
                return (c > 0) ? 1 : (c == 0) ? 0 : -1;
            }
        });

        if (!center || typeof center != 'number') {
            throw new Error('you must specify center index')
        }
        
        this.root = new IntervalNode(center, this);
    }

    add(range: Range, id: number, data: T) {
        if (this.intervalHash[id]) {
            throw new Error(`id ${id} is already registered`)
        }

        if (id == undefined) {
            while (this.intervalHash[this._autoIncrement]) {
                this._autoIncrement++
            }
            id = this._autoIncrement;
        }

        const itvl = new Interval(range, id, data);
        this.pointTree.insert([itvl.start, id]);
        this.pointTree.insert([itvl.end, id]);
        this.intervalHash[id] = itvl;
        this._autoIncrement++;
        insert.call(this, this.root, itvl);
    }

    search(val1: number, val2?: number): IntervalResult[] {
        const ret: IntervalResult[] = [];
        if (typeof val1 != 'number') {
            throw new Error(`${val1}: invalid input`)
        }

        if (val2 == undefined) {
            pointSearch.call(this, this.root, val1, ret);
        } else if (typeof val2 == 'number') {
            rangeSearch.call(this, val1, val2, ret);
        } else {
            throw new Error(`${val1}, ${val2}: invalid input`)
        }
        return ret;
    }

    remove(id: number) {
        throw new Error('No implementation');
    }
}

function insert<T = {}>(this: IntervalTree<T>, node: IntervalNode<T>, itvl: Interval<T>) {
    if (itvl.end < node.idx) {
        if (!node.left) {
            node.left = new IntervalNode((itvl.start + itvl.end) / 2, this as any);
        }
        return insert.call(this, node.left, itvl);
    }

    if (node.idx < itvl.start) {
        if (!node.right) {
            node.right = new IntervalNode((itvl.start + itvl.end) / 2, this)
        }
        return insert.call(this, node.right, itvl)
    }

    return node.insert(itvl);
}

function pointSearch<T = {}>(this: IntervalTree<T>, node: IntervalNode<T>, idx: number, arr: IntervalResult[]) {
    if (!node) return;

    if (idx < node.idx) {
        node.starts.every((itvl) => {
            const test = (itvl.start <= idx);
            if (test) arr.push(itvl.result())
            return test;
        });
        return pointSearch.call(this, node.left, idx, arr);
    }
    else if (idx > node.idx) {
        node.ends.every((itvl) => {
            const test = (itvl.end >= idx);
            if (test) arr.push(itvl.result());
            return test;
        })
        return pointSearch.call(this, node.right, idx, arr);
    }
    else {
        node.starts.forEach((itvl) => {arr.push(itvl.result())})
    }
}

function rangeSearch<T = {}>(this: IntervalTree<T>, start: number, end: number, arr: IntervalResult[]) {
    if (end - start <= 0) {
        throw new RangeError(`end must be greater than start. start: ${start}, end: ${end}`);
    }
    const resultHash = {};

    const wholeWraps: IntervalResult[] = [];
    pointSearch.call(this, this.root, (start + end) >> 2, wholeWraps);
    wholeWraps.forEach((result) => {
        resultHash[result.id] = true;
    });

    let idx1 = this.pointTree.bSearch([start, null]);
    const pointTreeArray = this.pointTree;
    while(idx1 >= 0 && pointTreeArray[idx1][0] == start) {
        idx1--;
    }

    let idx2 = this.pointTree.bSearch([end, null]);
    if (idx2 >= 0) {
        var len = pointTreeArray.length -1;
        while (idx2 <= len && pointTreeArray[idx2][0] <= end) {
            idx2++;
        }

        pointTreeArray.slice(idx1 + 1, idx2).forEach((point) => {
            const id = point[1]
            resultHash[id] = true;
        });
        
        Object.keys(resultHash).forEach((id) => {
            const itvl = this.intervalHash[id];
            arr.push(itvl.result(start, end));
        })
    }
}