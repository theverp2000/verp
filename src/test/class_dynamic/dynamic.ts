import { Store } from "./store";

export class DynamicClass {
    name: string;
    code: number;
    extra: any;
    constructor(className: string, opts: any) {
        if (Store[className] === undefined || Store[className] === null) {
            throw new Error(`Class type of '${className}' is not in the store`);
        }
        this.name = className;
        this.code = 1;
        return new Store[className](opts);
    }
}