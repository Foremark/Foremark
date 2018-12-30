import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {SignalHook} from './components/signalhook';
import {TableOfContents} from './toc';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

function shouldShowTocByDefault(document: HTMLElement): boolean {
    return document.querySelectorAll('h1, h2, h3, h4, h5, h6, h7, h8, h9')
        .length > 6;
}

export interface AppProps {
    foremarkDocument: HTMLElement;
    renderPromise: Promise<void>;
}

interface AppState {
    /**
     * `true` if the user wants to display the TOC. This does not apply to
     * screen sizes where the sidebar is displayed in a modal window.
     */
    tocVisible: boolean;
    /**
     * `true` if the user wants to display the sidebar. Only applicable to
     * screen sizes where the sidebar is displayed in a modal window.
     */
    sidebarModalVisible: boolean;
    loaderActivity: boolean;
    searchQuery: string;
}

export class App extends React.Component<AppProps, AppState> {
    refs: any;

    constructor(props: AppProps) {
        super(props);

        this.state = {
            tocVisible: shouldShowTocByDefault(props.foremarkDocument),
            sidebarModalVisible: false,
            loaderActivity: true,
            searchQuery: '',
        };

        props.renderPromise.then(() => {
            this.setState({loaderActivity: false});
        });
    }

    @bind
    private handleSidebarToggle(e: Event): void {
        const tocVisible = (e.target as HTMLInputElement).checked;
        this.setState({
            tocVisible,
        });
    }

    @bind
    private handleSidebarModalToggle(e: Event): void {
        const sidebarModalVisible = (e.target as HTMLInputElement).checked;
        this.setState({ sidebarModalVisible });
    }

    @bind
    private handleSearchQuery(e: Event): void {
        this.setState({
            searchQuery: (e.target as HTMLInputElement).value,
        });
    }

    @bind
    private handleModalBackgroundClick(): void {
        this.setState({ sidebarModalVisible: false });
    }

    private get isModelessSidebarVisible(): boolean {
        const {state} = this;
        return state.tocVisible;
    }

    render() {
        const {state, isModelessSidebarVisible} = this;
        return <div className={classnames({
                    [CN.root]: true,
                    [CN.sidebarModalVisible]: state.sidebarModalVisible,
                    [CN.sidebarVisible]: isModelessSidebarVisible,
                })}>

            <aside>
                <div className={CN.modalBackground}
                    onClick={this.handleModalBackgroundClick}
                    />

                <div className={CN.toolbar}>
                    {/* Toggle sidebar visibility. */}
                    <input
                        id='sidebarToggle'
                        type='checkbox'
                        onChange={this.handleSidebarToggle}
                        checked={isModelessSidebarVisible} />
                    <label for='sidebarToggle' className={CN.sidebarToggle}>
                        <span />
                        {isModelessSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                    </label>

                    {/*
                      * Toggle sidebar visibility (for screen sizes where
                      * the sidebar is displayed in a modal window).
                      */}
                    <input
                        id='sidebarToggleModal'
                        type='checkbox'
                        onChange={this.handleSidebarModalToggle}
                        checked={state.sidebarModalVisible} />
                    <label for='sidebarToggleModal' className={CN.sidebarToggleModal}>
                        <span />
                        {state.sidebarModalVisible ? 'Hide sidebar' : 'Show sidebar'}
                    </label>

                    {/* Activity indicator */}
                    { state.loaderActivity && <span className={CN.spinner} role='progressbar' /> }
                </div>
                <div className={CN.sidebar}>
                    {/* Search field */}
                    <span className={CN.search}>
                        <input
                            onChange={this.handleSearchQuery}
                            onInput={this.handleSearchQuery}
                            value={state.searchQuery}
                            type='search'
                            aria-label='Search'
                            placeholder="Search" />
                        <span />
                    </span>
                    {/* TODO: "clear" button */}
                    {/* TODO: hotkeys: ESC, '/' */}

                    <nav>
                        <TableOfContents
                            foremarkDocument={this.props.foremarkDocument}
                            searchQuery={state.searchQuery} />
                    </nav>
                </div>
            </aside>

            <Port
                tagName='main'
                element={this.props.foremarkDocument} />
        </div>;
    }
}

