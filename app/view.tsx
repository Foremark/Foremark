import * as React from 'react';

import {Port} from './components/port';

require('./view.less');
document.getElementsByTagName('html')[0].classList.add('mf-processed');

export interface AppProps {
    markfrontDocument: HTMLElement;
}

export class App extends React.Component<AppProps> {
    constructor(props: AppProps) {
        super(props);
    }

    render() {
        return <Port element={this.props.markfrontDocument} />;
    }
}

