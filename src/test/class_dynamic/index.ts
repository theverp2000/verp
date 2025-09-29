import { DynamicClass } from "./dynamic";

class Main {
    constructor() {}

    start(): void {
        try {
            const tesla = new DynamicClass('Tesla', 'OpenAI');
            console.log(`Type of object 'tesla': ${tesla.constructor.name}`);
            tesla.extra
            const audi: any = new DynamicClass('Audi', 'Jarvis');
            console.log(`Type of object 'audi': ${tesla.constructor.name}`);


        } catch (e) {
            console.error(e);
        }
    }
}

new Main().start();