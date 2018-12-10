import * as React from 'preact';

const eventKeys: string[] = ['scroll', 'resize'];

export interface EventHookProps<T> {
    [key: string]: any;

    target: T;

    scroll?: (this: T, ev: UIEvent) => any;
    resize?: (this: T, ev: UIEvent) => any;
}

/**
 * A React component that captures and forwards `document`'s events.
 */
export class EventHook<T extends EventTarget> extends React.Component<EventHookProps<T>, {}> {
    refs: any;

    componentDidMount(): void {
        const {props} = this;
        for (const key of eventKeys) {
            const handler = props[key];
            if (handler) {
                props.target.addEventListener(key, handler);
            }
        }
    }

    componentWillUnmount(): void {
        const {props} = this;
        for (const key of eventKeys) {
            const handler = props[key];
            if (handler) {
                props.target.removeEventListener(key, handler);
            }
        }
    }

    componentDidUpdate(prevProps: EventHookProps<T>, prevState: {}): void {
        const {props} = this;
        for (const key of eventKeys) {
            const handler = props[key];
            const oldHandler = prevProps[key];
            if (oldHandler !== handler) {
                if (oldHandler) {
                    prevProps.target.removeEventListener(key, oldHandler);
                }
                if (handler) {
                    props.target.addEventListener(key, handler);
                }
            }
        }
    }

    shouldComponentUpdate() { return false; }
    render() { return null; }
}
