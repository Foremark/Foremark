import * as React from 'preact';

export interface PortProps extends JSX.HTMLAttributes {
    element: HTMLElement;
    tagName?: string;
}

/**
 * Displays a given element in a `<div>` wrapper. Useful for stateful elements.
 */
export class Port extends React.Component<PortProps, {}> {
    private wrapper: null | HTMLElement = null;

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
        const {element, tagName, ...rest} = this.props;

        const Tag = tagName || 'div';

        return <Tag
            ref={(e: HTMLElement) => {this.wrapper = e;}}
            {...rest} />;
    }
}
