import * as React from 'preact';

import {Signal} from '../../utils/signal'

export interface SignalHookProps<T> {
    signal: Signal<T>;

    slot?: (this: unknown, arg: T) => any;
}

/**
 * A React component that captures and forwards signals.
 */
export class SignalHook<T> extends React.Component<SignalHookProps<T>, {}> {
    refs: any;

    componentDidMount(): void {
        const {props} = this;
        if (props.slot) {
            props.signal.connect(props.slot);
        }
    }

    componentWillUnmount(): void {
        const {props} = this;
        if (props.slot) {
            props.signal.disconnect(props.slot);
        }
    }

    componentDidUpdate(prevProps: SignalHookProps<T>, prevState: {}): void {
        const {props} = this;
        if (prevProps.slot !== props.slot) {
            if (prevProps.slot) {
                prevProps.signal.disconnect(prevProps.slot);
            }
            if (props.slot) {
                props.signal.connect(props.slot);
            }
        }
    }

    shouldComponentUpdate() { return false; }
    render() { return null; }
}
