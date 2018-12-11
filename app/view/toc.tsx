import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {EventHook} from './components/eventhook';
import {forEachNodePreorder} from '../utils/dom';

const CN = require('./toc.less');

export interface TableOfContentsProps {
    markfrontDocument: HTMLElement;
}

interface TableOfContentsState {
    /**
     * The full path of the currently active node.
     *
     * This value is uniquely determined from the active node. Nevertheless we
     * store the full path in order to determine the active state of a collapsed
     * `NodeView` quickly.
     */
    activeNodePath: ReadonlyArray<Node>;
}

export class TableOfContents extends React.Component<TableOfContentsProps, TableOfContentsState> {
    refs: any;

    private root: Node;
    private allNodes: Node[];

    private suspendActiveNodeUpdate = false;

    constructor(props: TableOfContentsProps) {
        super(props);

        this.state = {
            activeNodePath: [],
        };

        this.allNodes = enumerateNodes(props.markfrontDocument);
        this.root = buildNodeTree(this.allNodes);
    }

    @bind
    private handleScroll(): void {
        this.recalculateAndSetActiveNode();
    }

    @bind
    private handleResize(): void {
        this.recalculateAndSetActiveNode();
    }

    private recalculateAndSetActiveNode(): void {
        if (this.suspendActiveNodeUpdate) {
            return;
        }

        const refY = document.body.scrollTop + 40;

        let activeNode: Node | null = null;
        for (const node of this.allNodes) {
            let top = 0;
            for (let e: HTMLElement | null = node.anchor!; e; e = e.offsetParent as HTMLElement) {
                top += e.offsetTop;
            }
            if (top > refY) {
                break;
            }
            activeNode = node;
        }

        this.setActiveNode(activeNode);
    }

    private setActiveNode(newActiveNode: Node | null): void {
        const {activeNodePath} = this.state;
        const activeNode = activeNodePath.length ?
            activeNodePath[activeNodePath.length - 1] : null;

        if (activeNode !== newActiveNode) {
            const path = [];
            for (let n: Node | null = newActiveNode; n; n = n.parent) {
                path.unshift(n);
            }
            this.setState({
                activeNodePath: path,
            });
        }
    }

    @bind
    private handleNodeClick(node: Node): void {
        // If a user clicks a node near the end of the document, the scroll
        // position is limited by the bottom edge of the document. As a result,
        // the active node determined by `recalculateAndSetActiveNode` might not
        // point the node the user just clicked. This might feel weird to users.
        //
        // We fix this by temporarily overriding the decision by
        // `recalculateAndSetActiveNode`.
        this.suspendActiveNodeUpdate = true;
        this.setActiveNode(node);
        setTimeout(() => {
            this.suspendActiveNodeUpdate = false;
        }, 50);
    }

    render() {
        return <ul className={CN.root}>
            <EventHook target={document} scroll={this.handleScroll} />
            <EventHook target={window} resize={this.handleResize} />

            {this.root.children.map((child, i) =>
                <NodeView
                    key={i}
                    node={child}
                    tocState={this.state}
                    onNodeClick={this.handleNodeClick} />)}
        </ul>;
    }
}

interface Node {
    /** The HTML element of the heading. `null` for the root node. */
    label: HTMLElement | null;
    /** The HTML element of the anchor. `null` for the root node. */
    anchor: HTMLElement | null;
    level: number;
    children: Node[];
    parent: Node | null;
}

function enumerateNodes(document: HTMLElement): Node[] {
    const nodes: Node[] = [];

    const idMap = new Map<string, HTMLElement>();
    forEachNodePreorder(document, node => {
        if (!(node instanceof HTMLElement)) {
            return;
        }
        const {id} = node;
        if (!id) {
            return;
        }
        idMap.set(id, node);
    });

    forEachNodePreorder(document, node => {
        if (!(node instanceof HTMLElement)) {
            return;
        }
        const match = node.tagName.match(/^h([0-9])$/i);
        if (match) {
            // Find the anchor element
            const id = node.getAttribute('data-anchor');
            const anchor = (id && idMap.get(id)) || node;

            nodes.push({
                label: node,
                anchor,
                level: parseInt(match[1], 10),
                children: [],
                parent: null,
            });
        }
    });

    return nodes;
}

/**
 * Construct a tree from a flat list of nodes.
 */
function buildNodeTree(nodes: Node[]): Node {
    const root: Node = {
        label: null,
        anchor: null,
        level: 0,
        children: [],
        parent: null,
    };
    const levels: Node[] = [];
    for (let i = 0; i < 10; ++i) {
        levels.push(root);
    }

    for (const node of nodes) {
        levels[node.level].children.push(node);
        node.parent = levels[node.level];
        for (let i = node.level + 1; i < levels.length; ++i) {
            levels[i] = node;
        }
    }

    return root;
}

interface NodeViewProps {
    node: Node;
    onNodeClick: (node: Node) => void;
    tocState: TableOfContentsState;
}

class NodeView extends React.Component<NodeViewProps> {
    refs: any;

    private label: HTMLElement;

    constructor(props: NodeViewProps) {
        super(props);

        // Clone the heading element to create a TOC label
        const label = this.label = props.node.label!.cloneNode(true) as HTMLElement;
        label.removeAttribute('id');
    }

    @bind
    private handleClick(): void {
        this.props.onNodeClick(this.props.node);
    }

    render() {
        const {node, tocState, onNodeClick} = this.props;

        // TODO: Expand/collapse nodes

        const active =
            tocState.activeNodePath.length == node.level + 1 &&
            node === tocState.activeNodePath[node.level];

        return <li class={classnames({[CN.active]: active})}>
            <Port
                tagName='a'
                element={this.label}
                onClick={this.handleClick}
                href={'#' + node.anchor!.id} />
            {
                node.children.length > 0 ?
                    <ul>
                        {node.children.map((child, i) =>
                            <NodeView
                                key={i}
                                node={child}
                                tocState={tocState}
                                onNodeClick={onNodeClick} />)}
                    </ul>
                :
                    null
            }
        </li>;
    }
}
