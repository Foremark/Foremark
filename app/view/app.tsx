import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {SignalHook} from './components/signalhook';
import {TableOfContents} from './toc';
import {SearchPane} from './search';
import {onLoaderUpdate, isLoaderActive} from './loader';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

function shouldShowTocByDefault(document: HTMLElement): boolean {
    return document.querySelectorAll('h1, h2, h3, h4, h5, h6, h7, h8, h9')
        .length > 6;
}

export interface AppProps {
    markfrontDocument: HTMLElement;
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
    searchFocus: boolean;
}

export class App extends React.Component<AppProps, AppState> {
    refs: any;

    constructor(props: AppProps) {
        super(props);

        this.state = {
            tocVisible: shouldShowTocByDefault(props.markfrontDocument),
            sidebarModalVisible: false,
            loaderActivity: isLoaderActive(),
            searchQuery: '',
            searchFocus: false,
        };
    }

    @bind
    private handleSidebarToggle(e: Event): void {
        const tocVisible = (e.target as HTMLInputElement).checked;
        this.setState({
            tocVisible,
            // The sidebar is always visible when there's a search query. So,
            // erase the search query if the user wants to hide the sidebar.
            searchQuery: tocVisible ? this.state.searchQuery : '',
        });
    }

    @bind
    private handleSidebarModalToggle(e: Event): void {
        const sidebarModalVisible = (e.target as HTMLInputElement).checked;
        this.setState({ sidebarModalVisible });
    }

    @bind
    private handleLoaderUpdate(): void {
        this.setState({
            loaderActivity: isLoaderActive(),
        });
    }

    @bind
    private handleSearchQuery(e: Event): void {
        this.setState({
            searchQuery: (e.target as HTMLInputElement).value,
        });
    }

    @bind
    private handleSearchEnter(): void {
        this.setState({
            searchFocus: true,
            sidebarModalVisible: true,
        });
    }

    @bind
    private handleSearchLeave(): void {
        this.setState({ searchFocus: false });
    }

    @bind
    private handleModalBackgroundClick(): void {
        this.setState({ sidebarModalVisible: false });
    }

    private get isSearchPaneVisible(): boolean {
        const {state} = this;
        return state.searchQuery !== '' || state.searchFocus
    }

    private get isModelessSidebarVisible(): boolean {
        const {state} = this;
        return state.tocVisible || this.isSearchPaneVisible;
    }

    render() {
        const {state, isModelessSidebarVisible, isSearchPaneVisible} = this;
        return <div className={classnames({
                    [CN.root]: true,
                    [CN.sidebarModalVisible]: state.sidebarModalVisible,
                    [CN.sidebarVisible]: isModelessSidebarVisible,
                })}>

            <SignalHook signal={onLoaderUpdate} slot={this.handleLoaderUpdate} />

            <aside>
                <div className={CN.modalBackground}
                    onClick={this.handleModalBackgroundClick}
                    />

                <div className={CN.toolbar}>
                    {/* Search field */}
                    <input
                        className={CN.search}
                        onChange={this.handleSearchQuery}
                        onFocus={this.handleSearchEnter}
                        onBlur={this.handleSearchLeave}
                        value={state.searchQuery}
                        placeholder="Search" />
                    {/* TODO: "clear" button */}
                    {/* TODO: hotkeys: ESC, '/' */}

                    {/* Toggle sidebar visibility. */}
                    <input
                        id='sidebarToggle'
                        type='checkbox'
                        onChange={this.handleSidebarToggle}
                        checked={isModelessSidebarVisible} />
                    <label for='sidebarToggle' className={CN.sidebarToggle}>
                        <span />
                        {isModelessSidebarVisible ? 'Hide sidebar' : 'Show hidebar'}
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
                        {state.sidebarModalVisible ? 'Hide sidebar' : 'Show hidebar'}
                    </label>

                    {/* Activity indicator */}
                    { state.loaderActivity && <span className={CN.spinner} /> }
                </div>
                <div className={CN.sidebar}>
                    <nav className={classnames({
                        [CN.show]: !isSearchPaneVisible,
                    })}>
                        <TableOfContents markfrontDocument={this.props.markfrontDocument} />
                    </nav>
                    <nav className={classnames({
                        [CN.show]: isSearchPaneVisible,
                    })}>
                        <SearchPane
                            markfrontDocument={this.props.markfrontDocument}
                            query={state.searchQuery} />
                    </nav>
                </div>
            </aside>

            <Port
                tagName='main'
                element={this.props.markfrontDocument} />
        </div>;
    }
}

