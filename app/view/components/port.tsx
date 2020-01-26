import * as React from 'preact';

export interface PortProps extends React.JSX.HTMLAttributes {
    element: HTMLElement;
    tagName?: string;
    /**
     * Use `dangerouslySetInnerHTML` to inject the element.
     *
     * This is useful and only available when doing a server-side rendering.
     * If `element` is static, turning on this option does not change how the
     * page is rendered so much. There are two important changes to be
     * considered when turning on this option:
     *
     *  - Rendering using this option takes more processing power because entire
     *    the tree of `element` has to be serialized and deserialized again.
     *
     *  - The rendered elements are distinct from `element`. Modifications made
     *    childrens of `element` are not visible and event handlers registered
     *    on them won't work.
     *
     * This prop cannot be dynamically changed.
     */
    injectAsHtml?: boolean;
}

interface State {
    html?: string;
}

/**
 * Displays a given element in a `<div>` wrapper. Useful for stateful elements.
 */
export class Port extends React.Component<PortProps, State> {
    private wrapper: null | HTMLElement = null;

    refs: any;

    constructor(props: PortProps) {
        super(props);


        if (!process.env.FOREMARK_STRIP_SSR && this.props.injectAsHtml) {
            this.state = {html: props.element.outerHTML};
        } else {
            this.state = {};
        }
    }

    componentDidMount(): void {
        if (this.wrapper) {
            this.wrapper.appendChild(this.props.element);
        }
    }

    componentWillUnmount(): void {
        if (this.wrapper) {
            this.wrapper.removeChild(this.props.element);
        }
    }

    componentDidUpdate(prevProps: PortProps, prevState: {}): void {
        if (this.props.element === prevProps.element) {
            return;
        }
        if (!process.env.FOREMARK_STRIP_SSR && this.props.injectAsHtml) {
            this.setState({html: this.props.element.outerHTML});
        }
        if (this.wrapper) {
            this.wrapper.removeChild(prevProps.element);
            this.wrapper.appendChild(this.props.element);
        }
    }

    render() {
        const {element, tagName, children, injectAsHtml, ...rest} = this.props;

        // Ignore the false type error “Type '{ dangerouslySetInnerHTML: { __html:
        // string | undefined; }; }' is not assignable to type '{}'.” by erasing
        // the type
        const Tag: any = tagName || 'div';

        if (!process.env.FOREMARK_STRIP_SSR && injectAsHtml) {
            return <Tag dangerouslySetInnerHTML={{__html: this.state.html}} />;
        }

        return <Tag
            ref={(e: HTMLElement) => {this.wrapper = e;}}
            {...rest}>{children}</Tag>;
    }
}
