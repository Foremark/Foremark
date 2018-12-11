import * as React from 'preact';

import {Port} from './components/port';
import {TableOfContents} from './toc';

const CN = require('./app.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

export interface AppProps {
    markfrontDocument: HTMLElement;
}

export class App extends React.Component<AppProps> {
    refs: any;

    constructor(props: AppProps) {
        super(props);
    }

    render() {
        return <div className={CN.root}>
            <aside className={CN.nav}>
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

