import {removePrefix, analyzeIndent, IndentCommand} from '../utils/string';

interface Level {
    /**
     * The indentation of the previous level (which is equal to that of the
     * line that started this level).
     */
    originalIndentation: string;

    /**
     * The indentation of the contents.
     */
    bodyIndentation: string;

    type: LevelType;

    nextCounter: number;
}

const enum LevelType {
    TopLevel = 0,
    Unordered = 1,
    Ordered = 2,
    Definition = 3,
}

const LEVEL_PARTS: {
    initiator: (attr: string | number | null) => string;
    continue: (attr: string | number | null) => string;
    terminator: string;
}[] = [];

LEVEL_PARTS[LevelType.Unordered] = {
    initiator: s => `<ul><li class="${s}">`,
    continue: s => `</li><li class="${s}">`,
    terminator: '</li></ul>',
};
LEVEL_PARTS[LevelType.Ordered] = {
    initiator: s => `<ol start="${s}"><li>`,
    continue: s => `</li><li>`,
    terminator: '</li></ol>',
};
LEVEL_PARTS[LevelType.Definition] = {
    initiator: s => `<dd>`,
    continue: _ => '</dd><dd>',
    terminator: '</dd></dl>',
};

const MARKER_MAP = new Map<string, [LevelType, string | number | null]>([
    ['-', [LevelType.Unordered, 'minus']],
    ['+', [LevelType.Unordered, 'plus']],
    ['*', [LevelType.Unordered, 'asterisk']],
    [':', [LevelType.Definition, null]],
]);
const markerInfoFromString = (s: string) => MARKER_MAP.get(s) ||
    [LevelType.Ordered, parseInt(s, 10)];

export function replaceLists(html: string): string {
    const lines = html.split('\n');
    const output: string[] = [];

    // `true` if the last two elements of `output` are `['some raw text', '\n']`.
    let lastOutputIsText = false;

    // Stack where the *first* element is top
    const levels: Level[] = [
        {
            originalIndentation: '',
            bodyIndentation: '',
            type: LevelType.TopLevel,
            nextCounter: NaN,
        },
    ];
    let numPendingNewlines = 0;

    // Consider the following example:
    //
    // ```
    // term1
    // :   definition1
    // term2
    // :   definition2
    // ```
    //
    // When we are at `term2`, we can't tell if `term2` is a part of the
    // definition list that starts from `term1` or not. So, we store `term2`
    // to `definitionTermBuffer` until it's settled.
    let definitionTermBuffer: [string, string] | null = null;

    function removeTrailingNewline(): void {
        numPendingNewlines = 0;

        if (output[output.length - 1] === '\n') {
            output.pop(); // Remove trailing newline
        }
    }

    function closeCurrentList(): void {
        removeTrailingNewline();

        lastOutputIsText = false;
        output.push(LEVEL_PARTS[levels[0].type].terminator);

        levels.shift();

        if (definitionTermBuffer != null) {
            // The last nonmarker line we saw turned out to be not contents of
            // `<dt>`.

            flushDefinitionTermBuffer();
        }
    }

    /**
     * This function is called when a line stored to `definitionTermBuffer`
     * turned out to be not a part of a definition list.
     */
    function flushDefinitionTermBuffer(): void {
        const notTerm = removePrefix(definitionTermBuffer![0],
            levels[0].bodyIndentation) + definitionTermBuffer![1];

        lastOutputIsText = true;
        output.push(notTerm);
        output.push('\n');

        definitionTermBuffer = null;
    }

    for (let line of lines) {
        if (line.match(/^\s*$/)) {
            // A blank line lacks indentation information, so we defer
            // indentation change checking, whlist keeping the number of blank
            // lines.
            numPendingNewlines++;
            continue;
        }

        let [_2, indent, lineBody] = line.match(/^(\s*)(.*)$/)!;

        // Detect outdent
        let indentCommand: IndentCommand;
        while (
            (indentCommand = analyzeIndent(indent, levels[0].originalIndentation))
                == IndentCommand.Outdent
        ) {
            closeCurrentList();
        }

        // Detect list marker
        const markerMatch = lineBody.match(/^(:|-|\+|\*|\d+\.)([ \t]+)(\S.*)/);

        if (!markerMatch) {
            // No marker's here

            if (indentCommand != IndentCommand.Indent) {
                if (levels[0].type == LevelType.Definition) {
                    if (definitionTermBuffer != null) {
                        // A definiton list item cannot contain more than one
                        // line. So, the current definition list ends here.
                        closeCurrentList();
                    } else {
                        // This might be contents of `<dt>`.
                        numPendingNewlines = 0;
                        definitionTermBuffer = [indent, lineBody];
                        continue;
                    }
                } else if (levels.length > 1) {
                    // We are no longer in the list.
                    closeCurrentList();
                }
            }

            // Copy blank lines (Actually, this is the only place where
            // `numPendingNewlines` matters)
            for (; numPendingNewlines; --numPendingNewlines) {
                output.push('\n');
            }

            // Preserve indentation
            lineBody = removePrefix(indent, levels[0].bodyIndentation) + lineBody;

            lastOutputIsText = true;
            output.push(lineBody);
            output.push('\n');
            continue;
        }

        // Discard blank lines
        numPendingNewlines = 0;

        const [_, markerText, markerSpace, markerBody] = markerMatch;
        const [markerType, markerAttr] = markerInfoFromString(markerText);

        // Is this marker is an addition to the current list?
        let isContinuation = markerType == levels[0].type &&
            indentCommand == IndentCommand.Preserve;

        if (
            markerType === levels[0].type &&
            markerType == LevelType.Definition &&
            definitionTermBuffer != null
        ) {
            // ```
            // term1
            // :    definition1
            // term2
            //      :   definition2   <----
            // ```
            isContinuation = true;
        }

        if (!isContinuation && indentCommand != IndentCommand.Indent && levels.length > 1) {
            // Close the current list first.
            closeCurrentList();
        }

        if (isContinuation && markerType == LevelType.Ordered) {
            // Do we have to restart `<ol>`?
            if (markerAttr !== levels[0].nextCounter) {
                isContinuation = false;
                closeCurrentList();
            }
        }

        // Compute the indentation level of the item's body. Example:
        // ```
        //      - body
        // ^^^^^^^ this part
        // ```
        const markerBodyIndentation = indent + ' '
            .repeat(markerText.length + markerSpace.length);

        if (isContinuation) {
            levels[0].bodyIndentation = markerBodyIndentation;

            removeTrailingNewline();

            if (markerType == LevelType.Definition && definitionTermBuffer != null) {
                // Emit a `<dt>`.
                removeTrailingNewline();
                output.push('</dd><dt>');

                const term = removePrefix(definitionTermBuffer[0],
                    levels[0].originalIndentation) + definitionTermBuffer[1];
                output.push(term);
                output.push('</dt><dd>');
                definitionTermBuffer = null;

                lastOutputIsText = true;
                output.push(markerBody);
                output.push('\n');
                continue;
            }

            lastOutputIsText = true;
            output.push(LEVEL_PARTS[markerType].continue(markerAttr));
            output.push(markerBody);
            output.push('\n');

            ++levels[0].nextCounter;
        } else {
            // Start a new list.
            if (definitionTermBuffer) {
                throw new Error();
            }

            if (markerType === LevelType.Definition) {
                // A definition list takes the last line as the contents of `<dt>`.
                let term: string;
                if (lastOutputIsText) {
                    output.pop();
                    term = output.pop()!;
                } else {
                    term = '';
                }

                output.push('<dl><dt>');
                output.push(term);
                output.push('</dt>');
            }

            lastOutputIsText = true;
            output.push(LEVEL_PARTS[markerType].initiator(markerAttr));
            output.push(markerBody);
            output.push('\n');

            levels.unshift({
                bodyIndentation: markerBodyIndentation,
                originalIndentation: indent,
                type: markerType,
                nextCounter: (markerAttr as number) + 1,
            });
        }
    }

    while (levels.length > 1) {
        closeCurrentList();
    }
    removeTrailingNewline();

    return output.join('');
}
