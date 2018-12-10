import * as React from 'preact';

export interface PortProps {
    element: HTMLElement;

    className?: string;
    style?: any;
}

/**
 * Displays a given element in a `<div>` wrapper. Useful for stateful elements.
 */
export class Port extends React.Component<PortProps, {}> {
    private wrapper: null | HTMLDivElement = null;

    refs: any;

    shouldComponentUpdate() { return false; }

    componentDidMount(): void {
        if (!this.wrapper) {
            throw new Error();
        }
        this.wrapper.appendChild(this.props.element);
    }

    componentWillUnmount(): void {
        if (!this.wrapper) {
            throw new Error();
        }
        this.wrapper.removeChild(this.props.element);
    }

    componentDidUpdate(prevProps: PortProps, prevState: {}): void {
        if (this.props.element === prevProps.element) {
            return;
        }
        if (!this.wrapper) {
            throw new Error();
        }
        this.wrapper.removeChild(prevProps.element);
        this.wrapper.appendChild(this.props.element);
    }

    render() {
        return <div
                className={this.props.className}
                style={this.props.style}
                ref={(e) => {this.wrapper = e; }} />;
    }
}
