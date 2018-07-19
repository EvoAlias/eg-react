export interface EGService<T = {}> {
    name: string;
    getData: () => Promise<T>;
}