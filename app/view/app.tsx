import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {SignalHook} from './components/signalhook';
import {TableOfContents} from './toc';
import {onLoaderUpdate, isLoaderActive} from './loader';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

export interface AppProps {
    markfrontDocument: HTMLElement;
}

interface AppState {
    tocVisible: boolean;
    loaderActivity: boolean,
}

export class App extends React.Component<AppProps, AppState> {
    refs: any;

    constructor(props: AppProps) {
        super(props);

        this.state = {
            tocVisible: true,
            loaderActivity: isLoaderActive(),
        };
    }

    @bind
    private handleSidebarToggle(e: Event): void {
        this.setState({
            tocVisible: (e.target as HTMLInputElement).checked,
        });
    }

    @bind
    private handleLoaderUpdate(): void {
        this.setState({
            loaderActivity: isLoaderActive(),
        });
    }

    render() {
        const {state} = this;
        return <div className={classnames({
                    [CN.root]: true,
                    [CN.sidebarVisible]: state.tocVisible
                })}>

            <SignalHook signal={onLoaderUpdate} slot={this.handleLoaderUpdate} />

            <aside className={CN.sidebar}>
                <div className={CN.toolbar}>
                    {/* Search field */}
                    <input className={CN.search} placeholder="Search" />

                    {/* Toggle sidebar visibility */}
                    <input
                        id='sidebarToggle'
                        type='checkbox'
                        onChange={this.handleSidebarToggle}
                        checked={state.tocVisible} />
                    <label for='sidebarToggle' className={CN.sidebarToggle}>
                        <span />
                    </label>

                    {/* Activity indicator */}
                    { state.loaderActivity && <span className={CN.spinner} /> }
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

