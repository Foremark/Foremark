import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {EventHook} from './components/eventhook';
import {Sidebar} from './components/sidebar';
import {StyleConstants} from './constants';
import {Sitemap} from './sitemap';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

function shouldShowTocByDefault(document: HTMLElement): boolean {
    return document.querySelectorAll('h1, h2, h3, h4, h5, h6, h7, h8, h9')
        .length > 6;
}

export interface AppProps {
    foremarkDocument: HTMLElement;
    sitemap: Sitemap | null;
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
}

export class App extends React.Component<AppProps, AppState> {
    refs: any;

    private sidebar?: Sidebar;

    constructor(props: AppProps) {
        super(props);

        this.state = {
            tocVisible: props.sitemap != null || shouldShowTocByDefault(props.foremarkDocument),
            sidebarModalVisible: false,
            loaderActivity: true,
        };

        props.renderPromise.then(() => {
            this.setState({loaderActivity: false});
        });
    }

    @bind
    private handleSidebarToggle(e: Event): void {
        const tocVisible = (e.target as HTMLInputElement).checked;
        this.setState({ tocVisible });
    }

    @bind
    private handleSidebarModalToggle(e: Event): void {
        const sidebarModalVisible = (e.target as HTMLInputElement).checked;
        this.setState({ sidebarModalVisible });
    }

    @bind
    private handleModalBackgroundClick(): void {
        this.setState({
            sidebarModalVisible: false,
        });
        if (this.sidebar) {
            this.sidebar.hidePopups();
        }
    }

    private get isModelessSidebarVisible(): boolean {
        const {state} = this;
        return state.tocVisible;
    }

    @bind
    private handleHideModalSidebar(): void {
        this.setState({
            sidebarModalVisible: false,
        });
        if (this.sidebar) {
            this.sidebar.hidePopups();
        }
    }

    @bind
    private handleShowSidebar(): void {
        if (window.matchMedia(`screen and (max-width: ${StyleConstants.ScreenMediumMax}px)`).matches) {
            this.setState({sidebarModalVisible: true});
        } else {
            this.setState({tocVisible: true});
        }
    }

    @bind
    private handleWindowResize(): void {
        // The sidebar is displayed in a modal window only when the screen is
        // smaller than this threshold. The visibility state is maintained
        // separately for each of the modal and modeless versions of the sidebar.
        //
        // The visibility state of the modal version should be reset when
        // a window is resized and the modal version is no longer visible and
        // the modeless version is shown. Otherwise, users might observe a
        // somewhat surprising behavior while resizing a window, like a modal
        // sidebar all of sudden covering entire the screen just by resizing
        // a window.
        if (!window.matchMedia(`screen and (max-width: ${StyleConstants.ScreenMediumMax}px)`).matches) {
            if (this.state.sidebarModalVisible) {
                this.setState({sidebarModalVisible: false});
            }
        }
    }

    render() {
        const {props, state, isModelessSidebarVisible} = this;

        return <div className={classnames({
                    [CN.root]: true,
                    [CN.sidebarModalVisible]: state.sidebarModalVisible,
                    [CN.sidebarVisible]: isModelessSidebarVisible,
                })}>

            <EventHook target={window} resize={this.handleWindowResize} />

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
                    <Sidebar
                        ref={e => this.sidebar = e}
                        foremarkDocument={props.foremarkDocument}
                        sitemap={props.sitemap}
                        onShowSidebar={this.handleShowSidebar}
                        onNavigate={this.handleHideModalSidebar}
                        />
                </div>
            </aside>

            <Port
                tagName='main'
                element={this.props.foremarkDocument} />
        </div>;
    }
}

