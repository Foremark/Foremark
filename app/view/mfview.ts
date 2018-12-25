import {lazyModules} from './loader';
import {forEachNodePreorder} from '../utils/dom';
import {TagNames, AttributeNames, FIGURE_STANDARD_ID_RE} from '../markfront';

/** Tags introduced by `prepareMarkfrontForViewing`. */
const enum ViewTagNames {
    FloatingElementLabel = 'mf-label',
    Sidenote = 'mf-sidenote',
    DiagramInner = 'mf-diagram-inner',
}

/**
 * Transforms Markfront XML for viewing.
 */
export function prepareMarkfrontForViewing(node: Element): void {
    // Modify headings
    const counter = new Float64Array(10);
    const names: string[] = ['', '', '', '', '', '', '', '', '', ''];
    forEachNodePreorder(node, node => {
        if (!(node instanceof Element)) {
            return;
        }
        const match = node.tagName.match(/^h([1-9])$/i);
        if (match) {
            const level = parseInt(match[1], 10);
            counter[level] += 1;
            for (let i = level + 1; i < counter.length; ++i) {
                counter[i] = 0;
            }

            // Section number in `1.2.3` style
            const number = Array.prototype.slice.call(counter, 1, level + 1).join('.');

            // Determine the ID of the heading. If it doesn't have one, generate
            // one in a Markdeep-compatible way.
            names[level] = encodeURI((node.textContent || '').replace(/\s/g, '').toLowerCase());
            if (!names[level]) {
                // If the heading is empty for some reasons, just use the
                // heading number
                names[level] = number;
            }
            if (level > 1) {
                names[level] = names[level - 1] + '/' + names[level];
            }
            for (let i = level + 1; i < counter.length; ++i) {
                names[i] = names[level];
            }

            let id = node.getAttribute('id');
            if (!id) {
                id = names[level];
            }

            // Insert `<a>` for each heading
            node.removeAttribute('id');
            node.setAttribute('data-anchor', id);
            const a = document.createElement('a');
            a.id = id;
            a.className = 'anchor';
            node.parentElement!.insertBefore(a, node);

            // Display the section number
            node.insertAdjacentHTML('afterbegin', `<span class="section-number">${number}</span> `);
        }
    });

    // Process figures and endnotes
    const figureUsageError =
        `<${TagNames.Error}>` +
        `Usage error: <code>${TagNames.Figure}</code>` +
        `</${TagNames.Error}>`;
    const nextFigureNumber = new Map<string, number>();
    let nextEndnoteNumber = 1;

    const refLabelMap = new Map<string, [boolean, boolean, string]>();
    const floatingContentUsageMap = new Map<string, Element[]>();

    forEachNodePreorder(node, node => {
        if (!(node instanceof Element)) {
            return;
        }

        // Generate `computer` and `label` from `id`
        if (node.tagName === TagNames.Figure) {
            const id = node.getAttribute('id');
            let counter = node.getAttribute('counter');
            let label = node.getAttribute('label');

            if (counter == null && label == null) {
                if (!id) {
                    return;
                }
                const match = id && FIGURE_STANDARD_ID_RE.exec(id);
                if (!match) {
                    node.insertAdjacentHTML('beforebegin', figureUsageError);
                    return;
                }

                const [_, type, sep, base] = match;
                counter = type.toLowerCase();
                label = type.replace(/\{\}/g, '{\u200b}') + (sep === ' ' ? ' ' : '') + '{}';
            }

            // FIXME: How to handle these cases?
            if (counter == null) {
                counter = '';
            }
            if (label == null) {
                label = `??? {}`;
            }

            // Assign a figure number
            const number = (nextFigureNumber.get(counter) || 1);
            nextFigureNumber.set(counter, number + 1);

            label = label.replace(/\{\}/g, `${number}`) + ' ';

            // Generate a label
            const caption = node.getElementsByTagName(TagNames.FigureCaption)[0];
            if (caption) {
                const labelElem = document.createElement(ViewTagNames.FloatingElementLabel);
                labelElem.textContent = label;
                caption.insertBefore(labelElem, caption.firstChild);
            }

            // Move the caption under a figure
            if (caption) {
                node.appendChild(caption);
            }

            if (id) {
                refLabelMap.set(id, [false, false, label]);
            }
        } else if (node.tagName === TagNames.Note) {
            const id = node.getAttribute('id');
            if (!id) {
                return;
            }

            // Assign a note number
            const number = nextEndnoteNumber++;

            // Generate a label
            const labelElem = document.createElement(ViewTagNames.FloatingElementLabel);
            const label = `${number}`;
            labelElem.textContent = label;
            node.insertBefore(labelElem, node.firstChild);

            if (id) {
                refLabelMap.set(id, [true, false, label]);
            }
        } else if (node.tagName === TagNames.Ref) {
            const target = node.getAttribute('to') || '';

            let refs = floatingContentUsageMap.get(target);
            if (refs == null) {
                refs = [];
                floatingContentUsageMap.set(target, refs);
            }

            refs.push(node);
            return false;
        }
    });

    // Wrap the contents of `<TagNodes.Figure>` and `<TagNodes.Note>`.
    //
    //     <TagNames.Figure>
    //         <div>
    //             { children }
    //         </div>
    //     </TagNames.Figure>
    //
    // If a floating element doesn't have `id`, it may be directly layouted in
    // the side margin without being wrapped by `Sidenote`. However, the
    // sidenote layouting requires that a sidenote content is wrapped by
    // at least two wrappers. So, in such cases, an extra wrapper is necessary
    // for proper styling.
    forEachNodePreorder(node, node => {
        if (!(node instanceof Element) ||
            (node.tagName !== TagNames.Figure && node.tagName !== TagNames.Note)) {
            return;
        }

        // Wrap the contents
        const div = node.ownerDocument!.createElement('div');
        while (node.firstChild != null) {
            div.appendChild(node.firstChild);
        }
        node.appendChild(div);
    });

    const sidenotesDisabled = node.classList.contains('no-sidenotes');

    let hasSidenote = false;
    if (!sidenotesDisabled) {
        // On a large screen, we want to display figures and sidenotes in the
        // side margin, and also want them to be located right next to the
        // places where they are referenced.
        //
        // Conditionally changing an element's position in this way is
        // impossible to accomplish using a purely CSS-based solution. So,
        // we basically create a copy of figures and sidenotes to be inserted
        // to a different position, which we call "surrogates".
        //
        // If a floating element has `id` and sidenoting is enabled for it, then
        // clone the element and wrap it with `<ViewTagNames.Sidenote>`,
        // and then insert it to the first place where it's referenced.
        // On a large screen, the original floating content is hidden and
        // this surrogate is displayed instead.
        //
        //     <p>
        //         <!-- The surrogate: -->
        //         <Sidenote>
        //             <Figure>...</Figure>
        //         </Sidenote>
        //         <Ref /> depicts the muscular system of the horse.
        //     </p>
        //     <!-- The original definition: -->
        //     <Figure>...</Figure>
        //
        // If `id` is empty, it cannot be referenced by a body text, so we just
        // put it in the same place whatever the screen size is. Therefore,
        // a surrogate is not necessary.
        forEachNodePreorder(node, node => {
            if (!(node instanceof Element)) {
                return;
            }
            if (node.tagName !== TagNames.Figure && node.tagName !== TagNames.Note) {
                return;
            }
            const size = node.getAttribute('size');
            if (size === 'full') {
                // The "full" style needs the side margin to make sense.
                hasSidenote = true;
            }

            if (size === 'large' || size === 'full') {
                // Sidenote creation is disabled for this elemnet.
                return;
            }

            hasSidenote = true;

            if (!node.id) {
                // Surrogate is not needed
                node.classList.add('no-surrogate');
                return;
            }

            const refs = floatingContentUsageMap.get(node.id);
            if (refs == null) {
                // This element is not referenced anywhere. Can't create
                // a side note.
                return;
            }

            const cloned = node.cloneNode(true) as Element;
            const sidenote = node.ownerDocument!.createElement(ViewTagNames.Sidenote);
            cloned.id = 'sidenote.' + node.id;
            sidenote.appendChild(cloned);

            // Decide where to insert the sidenote
            let at = refs[0];
            for (let n: Element | null = at; n = n.parentElement; n) {
                if (n.tagName === 'table' || n.tagName === 'mf-sidenote') {
                    // We can't insert a `Sidenote` inside these elements.
                    at = n;
                }
            }
            at.parentElement!.insertBefore(sidenote, at);

            // Hide the original element on a large screen
            node.classList.add('hide-sidenote');

            refLabelMap.get(node.id)![1] = true;
        });
    }

    if (hasSidenote) {
        // Make a margin for sidenotes
        node.classList.add('has-sidenotes');
    }

    // Resolve `<TagNames.Ref>`s using `refLabelMap` created by the previous step
    forEachNodePreorder(node, node => {
        if (!(node instanceof Element)) {
            return;
        }
        if (node.tagName !== TagNames.Ref) {
            return;
        }

        const target = node.getAttribute('to') || '';
        const [endnote, sidenote, label] = refLabelMap.get(target) || [false, false, '?'];

        const link = document.createElement('a');
        link.href = '#' + encodeURIComponent(target);

        if (endnote) {
            const sup = document.createElement('sup');
            sup.textContent = label;
            link.appendChild(sup);
        } else {
            link.textContent = label;
        }

        // Replace <TagNames.Ref>` with a link
        node.parentElement!.insertBefore(link, node);
        node.parentElement!.removeChild(node);

        if (sidenote) {
            // Link to the sidenote version on a large screen
            const link2 = link.cloneNode(true) as HTMLAnchorElement;
            link2.href = '#' + encodeURIComponent('sidenote.' + target);
            link.parentElement!.insertBefore(link2, link);

            link.classList.add('hide-sidenote');
            link2.classList.add('only-sidenote');
        }

        return false;
    });

    // Render complex elements
    forEachNodePreorder(node, node => {
        if (node instanceof Element) {
            const tagName = node.tagName.toLowerCase();
            if (HANDLERS.hasOwnProperty(tagName)) {
                HANDLERS[tagName](node);
                return false;
            }
        }
        return true;
    });
}

const katexInlineOptions = {
    // These macros are defined by Markdeep
    macros: {
        '\\n': '\\hat{n}',
        '\\w': '{\\hat{\\omega}}',
        '\\wi': '{\\w_\\mathrm{i}}',
        '\\wo': '{\\w_\\mathrm{o}}',
        '\\wh': '{\\w_\\mathrm{h}}',
        '\\Li': '{L_\\mathrm{i}}',
        '\\Lo': '{L_\\mathrm{o}}',
        '\\Le': '{L_\\mathrm{e}}',
        '\\Lr': '{L_\\mathrm{r}}',
        '\\Lt': '{L_\\mathrm{t}}',
        '\\O': '{\\mathrm{O}}',
        '\\degrees': '{{^{\\large\\circ}}}',
        '\\T': '{\\mathsf{T}}',
        '\\mathset': '[1]{\\mathbb{#1}}',
        '\\Real': '{\\mathset{R}}',
        '\\Integer': '{\\mathset{Z}}',
        '\\Boolean': '{\\mathset{B}}',
        '\\Complex': '{\\mathset{C}}',
    },
    throwOnError: false,
} as katex.KatexOptions;
const katexDisplayOptions: katex.KatexOptions = {
    displayMode: true,
    ... katexInlineOptions,
};

const HANDLERS: { [tagName: string]: (node: Element) => void } & Object = {
    [TagNames.Equation]: async (node) => {
        const katex = await lazyModules.katex();
        node.innerHTML = katex.renderToString(node.textContent || '', katexInlineOptions);
    },
    [TagNames.DisplayEquation]: async (node) => {
        const katex = await lazyModules.katex();
        node.innerHTML = katex.renderToString(node.textContent || '', katexDisplayOptions);
    },
    [TagNames.Code]: async (node) => {
        const type = (node.getAttribute(AttributeNames.CodeType) || '').split(' ');
        const lang = type[0];
        if (lang === '') {
            return;
        }

        const hljs = await lazyModules.highlightJS();

        const highlighted = hljs.highlightAuto(node.textContent || '', [lang]);
        node.innerHTML = highlighted.value;

        // TODO: line numbers
    },
    [TagNames.Diagram]: async (node) => {
        const diagram = await lazyModules.diagram();
        const svgCode = diagram.to_svg(node.textContent!);
        node.innerHTML = svgCode;

        // Make the SVG image responsive
        const svg = node.firstElementChild as SVGSVGElement;
        const width = parseFloat(svg.getAttribute('width')!);
        const height = parseFloat(svg.getAttribute('height')!);

        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.removeAttribute('width');
        svg.removeAttribute('height');

        const inner = node.ownerDocument!.createElement(ViewTagNames.DiagramInner);
        inner.appendChild(svg);
        node.appendChild(inner);

        inner.style.maxWidth = `${width}px`;
    },
    'table': (node) => {
        // Wrap `<table>` with a `<div>` to display a horizontal scrollbar
        // as needed
        const wrapper = node.ownerDocument!.createElement('div');
        wrapper.className = 'tableWrapper';
        node.parentElement!.insertBefore(wrapper, node);
        wrapper.appendChild(node);
    },
};
