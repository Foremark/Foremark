// Provides a type for describing a set of strings.

export type Pattern =
    RegExp |
    ((text: string) => boolean) |
    string;

export function patternMatches(text: string, pat: Pattern): boolean {
    if (pat instanceof RegExp) {
        return pat.test(text);
    } else if (typeof pat === 'function') {
        return pat(text);
    } else if (typeof pat === 'string') {
        return pat === text;
    } else {
        throw new Error("Invalid pattern type");
    }
}
