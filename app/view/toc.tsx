import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {EventHook} from './components/eventhook';
import {forEachNodePreorder} from '../utils/dom';

const CN = require('./toc.less');

export interface TableOfContentsProps {
    foremarkDocument: HTMLElement;
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

    private root: ViewNode;
    private allNodes: Node[];

    private suspendActiveNodeUpdate = false;

    constructor(props: TableOfContentsProps) {
        super(props);

        this.state = {
            activeNodePath: [],
        };

        this.allNodes = enumerateNodes(props.foremarkDocument);
        const root = buildNodeTree(this.allNodes);

        // Create a view model of the TOC.
        this.root = createViewNode(root, null);
        this.root.expanded = true;
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
    private handleNodeClick(viewNode: ViewNode): void {
        // If a user clicks a node near the end of the document, the scroll
        // position is limited by the bottom edge of the document. As a result,
        // the active node determined by `recalculateAndSetActiveNode` might not
        // point the node the user just clicked. This might feel weird to users.
        //
        // We fix this by temporarily overriding the decision by
        // `recalculateAndSetActiveNode`.
        this.suspendActiveNodeUpdate = true;
        this.setActiveNode(viewNode.node);
        setTimeout(() => {
            this.suspendActiveNodeUpdate = false;
        }, 50);
    }

    render() {
        return <ul className={CN.root} role='tree'>
            <EventHook target={document} scroll={this.handleScroll} />
            <EventHook target={window} resize={this.handleResize} />

            {this.root.children.map((child, i) =>
                <NodeView
                    key={i}
                    viewNode={child}
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
        if (node.tagName.match(/blockquote|details|fieldset|figure|td/i)) {
            // Sectioning root
            return false;
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

/**
 * A view model of `Node`.
 */
interface ViewNode {
    node: Node;
    children: ViewNode[];
    parent: ViewNode | null;
    expanded: boolean | null;
}

/**
 * Creates a `ViewNode` tree.
 */
function createViewNode(node: Node, parent: ViewNode | null): ViewNode {
    const viewNode: ViewNode = {
        node,
        children: [],
        parent: null,
        expanded: null,
    };
    viewNode.children = node.children
        .map(child => createViewNode(child, viewNode));
    return viewNode;
};

interface NodeViewProps {
    viewNode: ViewNode;
    onNodeClick: (viewNode: ViewNode) => void;
    tocState: TableOfContentsState;
}

interface NodeViewState {
    expanded: boolean | null;
}

class NodeView extends React.Component<NodeViewProps, NodeViewState> {
    refs: any;

    private label: HTMLElement;

    constructor(props: NodeViewProps) {
        super(props);

        this.state = {
            expanded: props.viewNode.expanded,
        };

        // Clone the heading element to create a TOC label
        const label = this.label = props.viewNode.node.label!.cloneNode(true) as HTMLElement;
        label.removeAttribute('id');
    }

    private get shouldExpandByDefault(): boolean {
        const {viewNode, tocState} = this.props;

        // Expand by default if the active node is `node` or
        // a descendant of `node`
        return viewNode.node === tocState.activeNodePath[viewNode.node.level];
    }

    private get isExpanded(): boolean {
        return this.state.expanded != null ? this.state.expanded :
            this.shouldExpandByDefault;
    }

    private get isActive(): boolean {
        const {viewNode, tocState} = this.props;

        // If the node is expanded, do not display it as active unless the
        // node is exactly the active node (not an ancestor of it).
        if (this.isExpanded && tocState.activeNodePath.length != viewNode.node.level + 1) {
            return false;
        }

        return viewNode.node === tocState.activeNodePath[viewNode.node.level];
    }

    @bind
    private handleClick(): void {
        this.props.onNodeClick(this.props.viewNode);
    }

    @bind
    private handleToggle(e: Event): void {
        const expanded = !this.isExpanded;
        this.props.viewNode.expanded = expanded;
        this.setState({ expanded });
        e.stopPropagation();
        e.preventDefault();
    }

    render() {
        const {viewNode, tocState, onNodeClick} = this.props;
        const {node} = viewNode;

        const {isActive, isExpanded} = this;

        const expandable = viewNode.children.length > 0;

        return <li
                class={classnames({
                    [CN.active]: isActive,
                    [CN['L' + node.level]]: true,
                })}
                role='treeitem'
                aria-selected={`${isActive}`}
                aria-expanded={viewNode.children.length > 0 && `${isExpanded}`}
            >
            <Port
                tagName='a'
                element={this.label}
                onClick={this.handleClick}
                href={'#' + node.anchor!.id}>
                {
                    <button onClick={this.handleToggle} type='button'
                        className={isExpanded ? CN.expanded : CN.collapsed}
                        disabled={!expandable}>
                        {
                            expandable ? isExpanded ? 'Collapse' : 'Expand'
                                : 'Leaf'
                        }
                    </button>
                }
            </Port>
            {
                isExpanded && viewNode.children.length > 0 ?
                    <ul role='group'>
                        {viewNode.children.map((child, i) =>
                            <NodeView
                                key={i}
                                viewNode={child}
                                tocState={tocState}
                                onNodeClick={onNodeClick} />)}
                    </ul>
                :
                    null
            }
        </li>;
    }
}
