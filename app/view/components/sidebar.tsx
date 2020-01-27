import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {EventHook} from './eventhook';
import {PopupFrame} from './popup';
import {TableOfContents} from './toc';
import {Sitemap} from '../sitemap';

const CN = require('./sidebar.module.less');

const enum GlobalTocOperationButtonState {
    ExpandAll,
    CollapseAll,
    ClearSearch,
}

export interface SidebarProps {
    foremarkDocument: HTMLElement;
    sitemap: Sitemap | null;

    onShowSidebar: () => void;
    onNavigate: () => void;

    /** If specified, this function will be used for navigating external pages.*/
    assignLocation?: (url: string) => void;
}

interface State {
    searchQuery: string;
    helpVisible: boolean;

    /** `true` if all nodes in TOC are expanded because the user hit the
     * "expand all" button. */
    tocExpanded: boolean;
}

export class Sidebar extends React.Component<SidebarProps, State> {
    refs: any;

    private searchQueryElement?: HTMLInputElement | null;
    private tocComponent?: TableOfContents;

    constructor(props: SidebarProps) {
        super(props);

        this.state = {
            searchQuery: '',
            helpVisible: false,
            tocExpanded: false,
        };
    }

    hidePopups(): void {
        if (this.state.helpVisible) {
            this.setState({helpVisible: false});
        }
    }

    @bind
    private handleSearchQuery(e: Event): void {
        this.setState({
            searchQuery: (e.target as HTMLInputElement).value,
        });
    }

    @bind
    private handleWindowKeyDown(e: KeyboardEvent): void {
        if (e.target === this.searchQueryElement) {
            return;
        }
        if (e.key === '/') {
            this.props.onShowSidebar();
            this.searchQueryElement!.focus();
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === 'Escape') {
            if (this.state.helpVisible) {
                this.setState({helpVisible: false});
                return;
            }

            // Clear the search field
            this.setState({searchQuery: ''});
        } else if (e.key === '?') {
            if (!this.state.helpVisible) {
                this.props.onShowSidebar();
            }
            this.setState({helpVisible: !this.state.helpVisible});
        }
    }

    @bind
    private handleSearchQueryKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            // Lose focus
            this.searchQueryElement!.blur();

            // Clear the search field
            this.setState({searchQuery: ''});

            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === 'ArrowDown') {
            // Select the first row in the TOC
            this.tocComponent!.selectFirstNode();
        }
    }

    @bind
    private handleShowHelpPopup(e: Event): void {
        this.setState({helpVisible: (e.target as HTMLInputElement).checked});
    }

    @bind
    private handleDismissHelpPopup(): void { this.setState({ helpVisible: false }); }

    private get globalTocOperationButtonState(): GlobalTocOperationButtonState {
        const {state} = this;
        if (state.searchQuery.length > 0) {
            return GlobalTocOperationButtonState.ClearSearch;
        }

        return state.tocExpanded ?
            GlobalTocOperationButtonState.CollapseAll :
            GlobalTocOperationButtonState.ExpandAll;
    }

    @bind
    private handleGlobalTocOperationButton(): void {
        switch (this.globalTocOperationButtonState) {
            case GlobalTocOperationButtonState.ClearSearch:
                this.setState({searchQuery: ''});
                break;
            case GlobalTocOperationButtonState.CollapseAll:
                this.tocComponent!.collapseAll();
                this.setState({tocExpanded: false});
                break;
            case GlobalTocOperationButtonState.ExpandAll:
                this.tocComponent!.expandAll();
                this.setState({tocExpanded: true});
                break;
        }
    }

    @bind
    private handleTocNodeCollapse(): void {
        this.setState({tocExpanded: false});
    }

    @bind
    private handleWindowResize(): void {
        this.hidePopups();
    }

    render() {
        const {state, props, globalTocOperationButtonState} = this;

        return <div className={CN.sidebar}>
            {
                // Do not register an event handler if we are doing SSR.
                typeof window !== 'undefined' &&
                <EventHook target={window}
                    keydown={this.handleWindowKeyDown}
                    resize={this.handleWindowResize} />
            }

            {/* Search field */}
            <span className={CN.search}>
                <input
                    onChange={this.handleSearchQuery}
                    onInput={this.handleSearchQuery}
                    value={state.searchQuery}
                    type='search'
                    ref={e => this.searchQueryElement = e}
                    onKeyDown={this.handleSearchQueryKeyDown}
                    aria-label='Search'
                    placeholder='Search' />
            </span>

            <nav>
                <TableOfContents
                    ref={e => this.tocComponent = e}
                    foremarkDocument={props.foremarkDocument}
                    sitemap={props.sitemap}
                    onNavigate={props.onNavigate}
                    onNodeCollapse={this.handleTocNodeCollapse}
                    searchQuery={state.searchQuery}
                    assignLocation={props.assignLocation} />
            </nav>

            <span className={CN.toolbar2}>
                <button
                    className={classnames({
                        [CN.operateTOCGlobally]: true,
                        [CN.expandAll]: globalTocOperationButtonState ==
                            GlobalTocOperationButtonState.ExpandAll,
                        [CN.collapseAll]: globalTocOperationButtonState ==
                            GlobalTocOperationButtonState.CollapseAll,
                        [CN.clearSearch]: globalTocOperationButtonState ==
                            GlobalTocOperationButtonState.ClearSearch,
                    })}
                    onClick={this.handleGlobalTocOperationButton}
                    type='button'>
                    {
                        globalTocOperationButtonState == GlobalTocOperationButtonState.ClearSearch ?
                            'Clear search' :
                        globalTocOperationButtonState == GlobalTocOperationButtonState.ExpandAll ?
                            'Expand all' :
                        globalTocOperationButtonState == GlobalTocOperationButtonState.CollapseAll ?
                            'Collapse all' :
                            (() => { throw new Error() })
                    }
                </button>

                <input
                    id='toolbar-help'
                    type='checkbox'
                    onChange={this.handleShowHelpPopup}
                    checked={state.helpVisible} />
                <label
                    for='toolbar-help'
                    role='button'
                    aria-haspopup='dialog'
                    aria-expanded={`${state.helpVisible}`}
                    className={CN.helpButton}>
                    <i />
                    <span>About</span>
                </label>
                <div className={CN.helpPopup}>
                    <PopupFrame
                        active={state.helpVisible}
                        onDismiss={this.handleDismissHelpPopup}>
                        <Help />
                    </PopupFrame>
                </div>
            </span>
        </div>;
    }
}

const Help = () => (
    <div className={CN.help}>
        <h1>
            <a href={process.env.URL}>Foremark</a> <small>{process.env.VERSION}</small>
        </h1>
        <p>
            <code>{process.env.COMMITHASH}@{process.env.BRANCH}</code>
        </p>
        <hr />
        <h2>Keyboard shortcuts</h2>
        <ul>
            <li><kbd>?</kbd>Show this help dialog</li>
            <li><kbd>/</kbd>Focus the search field</li>
        </ul>
        <h3>While searching...</h3>
        <ul>
            <li><kbd>Esc</kbd>Clear the search field</li>
        </ul>
        <h3>When the table of contents is focused...</h3>
        <ul>
            <li><kbd>↑</kbd><kbd>↓</kbd>Jump to the previous/next section</li>
            <li><kbd>←</kbd><kbd>→</kbd>Expand/collapse a section</li>
            <li><kbd>⏎</kbd>Navigate to an external document</li>
        </ul>
    </div>
);