export class Lazy<T> {
    private x?: [T];

    constructor(private factory: () => T) {}

    get value(): T {
        if (!this.x) {
            this.x = [this.factory()];
        }
        return this.x[0];
    }
}
