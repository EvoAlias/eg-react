import { Entity } from "./Entity";

export interface Component<T = {}> {
    name: string;
    defaults?: T;
    getDefaults?: () => T;
}