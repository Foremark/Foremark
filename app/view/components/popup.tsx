import * as React from 'preact';
import bind from 'bind-decorator';

const root = document.body;

export interface PopupFrameProps
{
    className?: string;
    style?: any;

    active: boolean;
    onDismiss: () => void;
}

export class PopupFrame extends React.Component<PopupFrameProps, {}>
{
    private acceptDismiss = true;

    constructor(props: PopupFrameProps)
    {
        super(props);
    }

    @bind
    private handleBackgroundInput(e: MouseEvent | TouchEvent): void
    {
        if (this.props.active) {
            setTimeout(() => {
                if (this.acceptDismiss) {
                    this.props.onDismiss();
                }
            }, 20);
        }
    }

    @bind
    private handleForegroundInput(e: MouseEvent | TouchEvent): void
    {
        if (this.props.active) {
            this.acceptDismiss = false;
            setTimeout(() => { this.acceptDismiss = true; }, 50);
            e.stopPropagation();
        }
    }

    componentDidMount(): void
    {
        if (this.props.active) {
            root.addEventListener('mousedown', this.handleBackgroundInput);
            root.addEventListener('touchstart', this.handleBackgroundInput);
        }
    }

    componentWillUnmount(): void
    {
        root.removeEventListener('mousedown', this.handleBackgroundInput);
        root.removeEventListener('touchstart', this.handleBackgroundInput);
    }

    componentDidUpdate(prevProps: PopupFrameProps, prevState: {}): void
    {
        if (this.props.active != prevProps.active) {
            if (this.props.active) {
                root.addEventListener('mousedown', this.handleBackgroundInput);
                root.addEventListener('touchstart', this.handleBackgroundInput);
            } else {
                root.removeEventListener('mousedown', this.handleBackgroundInput);
                root.removeEventListener('touchstart', this.handleBackgroundInput);
            }
        }
    }

    render()
    {
        const {props} = this;
        return <div
            className={(props.className || '') + (props.active ? ' act' : '')}
            style={props.style}
            onTouchStart={this.handleForegroundInput}
            onMouseDown={this.handleForegroundInput}>{props.children}</div>;
    }
}
