/**
 * Removes the prefix `prefix` from a string `s` with a graceful error handling.
 */
export function removePrefix(s: string, prefix: string): string {
    let i = 0;
    while (i < prefix.length && i < s.length) {
        if (s.charCodeAt(i) != prefix.charCodeAt(i)) {
            break;
        }
        ++i;
    }

    return s.substr(i);
}

export const enum IndentCommand {
    Preserve,
    Indent,
    Outdent,
}

/**
 * Analyze the change in the indentation level.
 *
 * # Examples
 *
 *  - `analyzeIndent("\t\t", "\t")` returns `Indent`. In this case, `indent`
 *    has a prefix `ref` and an extra character.
 *  - `analyzeIndent("\t", "\t\t")` returns `Outdent`. In this case, `indent`
 *    is a prefix of `ref` and is shorter than `ref`.
 *  - `analyzeIndent("\t\t", "\t\t")` returns `Preserve`.
 *  - `analyzeIndent("\t\t", " ")` returns `Outdent`. In this case, the common
 *    longest prefix of `indent` and `ref` is shorter than `ref`.
 */
export function analyzeIndent(indent: string, ref: string): IndentCommand {
    let i = 0;
    while (i < indent.length && i < ref.length) {
        if (ref.charCodeAt(i) != indent.charCodeAt(i)) {
            break;
        }
        ++i;
    }
    if (i < ref.length) {
        return IndentCommand.Outdent;
    } else if (indent.length == ref.length) {
        return IndentCommand.Preserve;
    } else if (indent.length > ref.length) {
        return IndentCommand.Indent;
    } else {
        throw new Error();
    }
}