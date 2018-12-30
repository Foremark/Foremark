import {bind} from 'bind-decorator';

export class Debouncer {
    private pending: {
        fn: (this: void) => void;
        timer: number;
    } | null = null;

    constructor() {}

    @bind
    private handleTimeout(): void {
        const fn = this.pending!.fn;
        this.pending = null;
        fn();
    }

    invoke(fn: (this: void) => void, delay: number): void {
        if (this.pending) {
            window.clearTimeout(this.pending.timer);
        }
        this.pending = {
            fn,
            timer: window.setTimeout(this.handleTimeout, delay),
        };
    }
}
