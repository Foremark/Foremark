import * as React from 'preact';

import {Port} from './components/port';
import {forEachNodePreorder} from '../utils/dom';

const CN = require('./toc.less');

export interface TableOfContentsProps {
    markfrontDocument: HTMLElement;
}

export class TableOfContents extends React.Component<TableOfContentsProps> {
    refs: any;

    private root: Node;

    constructor(props: TableOfContentsProps) {
        super(props);

        this.root = scanNodes(props.markfrontDocument);
    }

    render() {
        return <ul className={CN.root}>
            {this.root.children.map((child, i) =>
                <NodeView key={i} node={child} />)}
        </ul>;
    }
}

interface Node {
    /** The HTML element of the heading. `null` for the root node. */
    element: HTMLElement | null;
    level: number;
    children: Node[];
}

function scanNodes(document: HTMLElement): Node {
    const nodes: Node[] = [];

    forEachNodePreorder(document, node => {
        if (!(node instanceof HTMLElement)) {
            return;
        }
        const match = node.tagName.match(/^h([0-9])$/i);
        if (match) {
            nodes.push({
                element: node,
                level: parseInt(match[1], 10),
                children: [],
            });
        }
    });

    // Construct a tree from a flat list of nodes
    const root: Node = {
        element: null,
        level: 0,
        children: [],
    };
    const levels: Node[] = [];
    for (let i = 0; i < 10; ++i) {
        levels.push(root);
    }

    for (const node of nodes) {
        levels[node.level].children.push(node);
        for (let i = node.level + 1; i < levels.length; ++i) {
            levels[i] = node;
        }
    }

    return root;
}

interface NodeViewProps {
    node: Node;
}

class NodeView extends React.Component<NodeViewProps> {
    refs: any;

    private label: HTMLElement;

    constructor(props: NodeViewProps) {
        super(props);

        // Clone the heading element to create a TOC label
        const label = this.label = props.node.element!.cloneNode(true) as HTMLElement;
        label.removeAttribute('id');
    }

    render() {
        const {node} = this.props;
        return <li>
            <Port
                element={this.label}
                tagName='a'
                href={'#' + node.element!.id} />
            {
                node.children.length > 0 ?
                    <ul>
                        {node.children.map((child, i) =>
                            <NodeView key={i} node={child} />)}
                    </ul>
                :
                    null
            }
        </li>;
    }
}
