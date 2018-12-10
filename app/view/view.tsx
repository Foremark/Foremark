import * as React from 'preact';

import {Port} from './components/port';

require('./view.less');
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
        return <Port element={this.props.markfrontDocument} />;
    }
}

