import { Entity } from "./Entity";

export interface Component {
    name: string;
}

export interface ComponentConstructor<T extends Component> {
    name: string;
    new(...args: any[]): T;
}