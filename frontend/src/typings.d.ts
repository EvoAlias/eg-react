declare module 'sortedlist' {
    var list: SortedListModule;

    interface SortedListModule {
        create: (arr?: any[], options?: SortedListOptions) => SortedList;
    }

    type Ord = (a: any, b: any) => number;
    type SortedListCompare = 'string' | 'number' | Ord

    interface SortedListOptions {

        /**
         *
       f * filter unique values in insertion.
         * @type {SortedListCompare}
         * @memberof SortedListOptions
         */
        compare?: SortedListCompare;

        /**
         *
         *function	register a filtration function which returns boolean indicating valid value, running before insertion. By default, function(v) { returns true }, that is, no filtration.  *
         * @memberof SortedListOptions
         */
        filter?: (value: any) => boolean;
        key?: string;

        /**
         *
         * if true, sets the array given in the second arguments with no filtration  *
         * @type {boolean}
         * @memberof SortedListOptions
         */
        resume?: boolean;
    }

    class SortedList<T = {}> extends Array<T> {
        constructor (arr?: T[], options?: SortedListOptions);
        constructor (options?: SortedListOptions);
        bSearch(val: T): number;
        key(val: T): number | null;
        insert(...args: T[]): void;
        insertOne(arg: T): T[];
        remove(pos: number): this;
        toArray(): number[];
        unique(createNew: boolean): SortedList;
    }

    export = SortedList;
}