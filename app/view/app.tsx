import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {TableOfContents} from './toc';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

export interface AppProps {
    markfrontDocument: HTMLElement;
}

interface AppState {
    tocVisible: boolean;
}

export class App extends React.Component<AppProps, AppState> {
    refs: any;

    constructor(props: AppProps) {
        super(props);

        this.state = {
            tocVisible: true,
        };
    }

    @bind
    private handleSidebarToggle(e: Event): void {
        this.setState({
            tocVisible: (e.target as HTMLInputElement).checked,
        });
    }

    render() {
        const {state} = this;
        return <div className={classnames({
                    [CN.root]: true,
                    [CN.sidebarVisible]: state.tocVisible
                })}>
            <aside className={CN.sidebar}>
                <div className={CN.toolbar}>
                    <input className={CN.search} placeholder="Search" />

                    <input
                        id='sidebarToggle'
                        type='checkbox'
                        onChange={this.handleSidebarToggle}
                        checked={state.tocVisible} />
                    <label for='sidebarToggle' className={CN.sidebarToggle}>
                        <span />
                    </label>
                </div>
                <nav>
                    <TableOfContents markfrontDocument={this.props.markfrontDocument} />
                </nav>
            </aside>
            <Port
                tagName='main'
                element={this.props.markfrontDocument} />
        </div>;
    }
}

