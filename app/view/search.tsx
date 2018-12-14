import * as React from 'preact';

const CN = require('./search.less');

export interface SearchPaneProps {
    markfrontDocument: HTMLElement;
    query: string;
}

export class SearchPane extends React.Component<SearchPaneProps> {
    refs: any;

    render() {
        return <div className={CN.root}>
            Not implemented yet :(
        </div>;
    }
}
