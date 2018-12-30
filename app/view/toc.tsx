import * as React from 'preact';
import {bind} from 'bind-decorator';
import * as classnames from 'classnames';

import {Port} from './components/port';
import {EventHook} from './components/eventhook';
import {forEachNodePreorder} from '../utils/dom';
import {Debouncer} from '../utils/debouncer';

const CN = require('./toc.less');

export interface TableOfContentsProps {
    foremarkDocument: HTMLElement;

    /**
     * When set, only the entries matching the query are displayed.
     */
    searchQuery?: string;

    onNavigate: () => void;
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

    private allNodes: Node[];
    private root: Node;

    private mainRoot: ViewNode;
    private searchRoot?: ViewNode;

    private suspendActiveNodeUpdate = false;

    private domRoot?: HTMLDivElement;

    constructor(props: TableOfContentsProps) {
        super(props);

        this.state = {
            activeNodePath: [],
        };

        this.allNodes = enumerateNodes(props.foremarkDocument);
        const root = this.root = buildNodeTree(this.allNodes);

        // Create a view model of the TOC.
        this.mainRoot = createViewNode(root, null);
        this.mainRoot.expanded = true;
    }

    componentWillReceiveProps(
        nextProps: TableOfContentsProps,
        nextState: TableOfContentsState
    ): void {
        if (nextProps.searchQuery && nextProps.searchQuery !== this.props.searchQuery) {
            // The search query was changed. Update the search view model.
            const query = nextProps.searchQuery.toLowerCase();
            this.searchRoot = createViewNode(this.root, null);
            applyFilterOnViewNode(this.searchRoot, node => {
                return node.label != null &&
                    node.label.textContent!.toLowerCase().indexOf(query) >= 0;
            });
        }
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
        this.didNavigateNode(viewNode.node);
        this.props.onNavigate();
    }

    /**
     * Should be called after a node is navigated.
     */
    private didNavigateNode(node: Node): void {
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

    private get rootViewNode(): ViewNode {
        return this.props.searchQuery ?
            this.searchRoot! : this.mainRoot;
    }

    private get highlightedViewNode(): ViewNode | null {
        const path = this.state.activeNodePath;
        let viewNode = this.rootViewNode;

        for (let i = 1; i < path.length; ++i) {
            if (viewNode.expanded === false) {
                break;
            }

            const node = path[i];
            const childViewNode = viewNode.children.find(c => c.node === node);
            if (!childViewNode) {
                break;
            }
            viewNode = childViewNode;
        }

        if (viewNode === this.rootViewNode) {
            return null;
        }

        return viewNode;
    }

    /**
     * Navigates a node. The node will be activated and scrolled into the
     * TOC's view.
     */
    private selectViewNode(viewNode: ViewNode): void {
        navigateNode(viewNode.node);
        this.didNavigateNode(viewNode.node);

        if (viewNode.nodeView) {
            viewNode.nodeView.scrollIntoView();
        }
    }

    @bind
    private handleKey(e: KeyboardEvent): void {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            let viewNode = this.highlightedViewNode;

            if (viewNode) {
                // Find the next/previous node in the displayed order.
                // Only the visible nodes are considered.
                if (e.key === 'ArrowUp') {
                    if (!viewNode.parent) {
                        return;
                    }
                    const i = viewNode.parent.children.indexOf(viewNode);
                    if (i < 0) {
                        throw new Error();
                    }
                    if (i === 0) {
                        viewNode = viewNode.parent;
                        if (viewNode === this.rootViewNode) {
                            return;
                        }
                    } else {
                        // Find the last visible view node in the previous sibling's
                        // descendants
                        viewNode = viewNode.parent.children[i - 1];
                        while (viewNode.expanded === true && viewNode.children.length > 0) {
                            viewNode = viewNode.children[viewNode.children.length - 1];
                        }
                    }
                } else {
                    if (viewNode.expanded === false || viewNode.children.length === 0) {
                        while (true) {
                            if (!viewNode.parent) {
                                return;
                            }
                            const children = viewNode.parent.children;
                            const i = children.indexOf(viewNode);
                            if (i < 0) {
                                throw new Error();
                            }
                            if (i + 1 === children.length) {
                                viewNode = viewNode.parent;
                            } else {
                                viewNode = children[i + 1];
                                break;
                            }
                        }
                    } else {
                        viewNode = viewNode.children[0];
                    }
                }
            } else {
                // Choose the first node
                viewNode = this.rootViewNode.children[0];
            }

            if (viewNode) {
                this.selectViewNode(viewNode);
            }

            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            let viewNode = this.highlightedViewNode;

            const expand = e.key === 'ArrowRight';

            if (viewNode) {
                if ((viewNode.expanded === false || viewNode.children.length === 0) && !expand) {
                    // Activate the parent node
                    if (!viewNode.parent || viewNode.parent === this.rootViewNode) {
                        return;
                    }

                    this.selectViewNode(viewNode.parent);
                } else if (viewNode.nodeView) {
                    // Expand/collapse the currently highlighted node
                    viewNode.nodeView.isExpanded = expand;
                }
                e.preventDefault();
            }
        }
    }

    /**
     * Navigates the top visible node. Does nothing if there are no nodes.
     */
    selectFirstNode(): void {
        const viewNode = this.rootViewNode.children[0];
        if (viewNode) {
            this.selectViewNode(viewNode);
            this.domRoot!.focus();
        }
    }

    render() {
        const root = this.rootViewNode;
        return <ul
            className={CN.root}
            role='tree'
            tabIndex={0}
            ref={e => this.domRoot = e}
            onKeyDown={this.handleKey}
        >
            <EventHook target={document} scroll={this.handleScroll} />
            <EventHook target={window} resize={this.handleResize} />

            {root.children.map((child, i) =>
                <NodeView
                    key={child.id}
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
    id: number;
    node: Node;
    children: ViewNode[];
    unfilteredChildren: ViewNode[];
    parent: ViewNode | null;
    expanded: boolean | null;
    nodeView: NodeView | null;
}

let nextViewNodeId = 1;

/**
 * Creates a `ViewNode` tree.
 */
function createViewNode(node: Node, parent: ViewNode | null): ViewNode {
    const viewNode: ViewNode = {
        node,
        id: nextViewNodeId++,
        children: [],
        unfilteredChildren: [],
        parent,
        expanded: null,
        nodeView: null,
    };
    viewNode.children = node.children
        .map(child => createViewNode(child, viewNode));
    viewNode.unfilteredChildren = viewNode.children;
    return viewNode;
}

/**
 * Applies a filter on a `ViewNode` tree. Returns `true` if there's a
 * descendant node matching the filtering criteria.
 */
function applyFilterOnViewNode(viewNode: ViewNode, query: (node: Node) => boolean): boolean {
    viewNode.expanded = true;

    viewNode.children = viewNode.unfilteredChildren
        .filter(childViewNode => applyFilterOnViewNode(childViewNode, query));

    return viewNode.children.length > 0 || query(viewNode.node);
}

const NAVIGATE_DEBOUNCER = new Debouncer();

/**
 * Programmatically navigate to a node.
 */
function navigateNode(node: Node): void {
    NAVIGATE_DEBOUNCER.invoke(() => {
        window.history.replaceState(null, document.title, '#' + node.anchor!.id);
    }, 500);
    node.anchor!.scrollIntoView(true);
}

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
    private element?: HTMLElement;

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

    get isExpanded(): boolean {
        if (this.props.viewNode.children.length === 0) {
            return false;
        }

        return this.state.expanded != null ? this.state.expanded :
            this.shouldExpandByDefault;
    }

    set isExpanded(expanded: boolean) {
        if (this.props.viewNode.children.length === 0) {
            return;
        }

        this.props.viewNode.expanded = expanded;
        this.setState({ expanded });
    }

    private get isActive(): boolean {
        const {viewNode, tocState} = this.props;

        const nextLevel = tocState.activeNodePath[viewNode.node.level + 1];

        // If the node is expanded, do not display it as active unless the
        // node is exactly the active node (not an ancestor of it).
        if (
            this.isExpanded && tocState.activeNodePath.length != viewNode.node.level + 1 &&
            // Only consider a part of the path that is included in the view model.
            // In a filtered view, a suffix of the path might not be in the view model.
            viewNode.children.find(c => c.node === nextLevel)
        ) {
            return false;
        }

        return viewNode.node === tocState.activeNodePath[viewNode.node.level];
    }

    componentDidMount(): void {
        this.props.viewNode.nodeView = this;
    }

    componentWillUnmount(): void {
        if (this.props.viewNode.nodeView === this) {
            this.props.viewNode.nodeView = null;
        }
    }

    scrollIntoView(): void {
        if (this.element) {
            // Scroll the view only if `element` is completely or partially
            // hidden due to scrolling
            let top = this.element.offsetTop;
            let bottom = top + this.element.offsetHeight;
            let e = this.element.offsetParent as HTMLElement;
            while (e && getComputedStyle(e).overflowY !== 'auto') {
                top += e.offsetTop;
                bottom += e.offsetTop;
                e = e.offsetParent as HTMLElement;
            }
            if (top < e.scrollTop) {
                this.element.scrollIntoView(true);
            } else if (bottom > e.scrollTop + e.clientHeight) {
                this.element.scrollIntoView(false);
            }
        }
    }

    @bind
    private handleClick(e: Event): void {
        this.props.onNodeClick(this.props.viewNode);

        // Intercept the link action to prevent losing a keyboard focus.
        e.stopPropagation();
        e.preventDefault();

        navigateNode(this.props.viewNode.node);
    }

    @bind
    private handleToggle(e: Event): void {
        this.isExpanded = !this.isExpanded;
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
                    [CN.item]: true,
                    [CN.active]: isActive,
                    [CN['L' + node.level]]: true,
                })}
                role='treeitem'
                aria-selected={`${isActive}`}
                aria-expanded={viewNode.children.length > 0 && `${isExpanded}`}
                ref={e => this.element = e}
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
