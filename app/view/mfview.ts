import {lazyModules} from './loader';
import {forEachNodePreorder} from '../utils/dom';
import {TagNames, AttributeNames, FIGURE_STANDARD_ID_RE} from '../markfront';

/** Tags introduced by `prepareMarkfrontForViewing`. */
const enum ViewTagNames {
    FloatingElementLabel = 'mf-label',
    Sidenote = 'mf-sidenote',
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

    const sidenotesDisabled = node.classList.contains('no-sidenotes');

    // Copy each floating content and wrap it with `<ViewTagNames.Sidenote>`,
    // and then insert it to the first place where it's referenced.
    // On a large screen, the original floating content is hidden and
    // the sidenote is displayed instead.
    // FIXME: This won't work as intended if `<TagNames.Ref>` is in a table
    let hasSidenote = false;
    if (!sidenotesDisabled) {
        forEachNodePreorder(node, node => {
            if (!(node instanceof Element)) {
                return;
            }
            if (node.tagName !== TagNames.Figure && node.tagName !== TagNames.Note) {
                return;
            }
            if (node.getAttribute('size') === 'large') {
                // Sidenote creation is disabled for this elemnet.
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

            const at = refs[0];
            at.parentElement!.insertBefore(sidenote, at);

            // Hide the original element on a large screen
            node.classList.add('hide-sidenote');

            refLabelMap.get(node.id)![1] = true;

            hasSidenote = true;
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
        const svg = diagram.to_svg(node.textContent!);
        node.innerHTML = svg;
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
