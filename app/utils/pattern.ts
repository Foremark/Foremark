// Provides a type for describing a set of strings.

export type Pattern<T> =
    RegExp |
    ((text: string, options: T) => boolean) |
    string;

export function patternMatches<T>(text: string, pat: Pattern<T>, options: T): boolean {
    if (pat instanceof RegExp) {
        return pat.test(text);
    } else if (typeof pat === 'function') {
        return pat(text, options);
    } else if (typeof pat === 'string') {
        return pat === text;
    } else {
        throw new Error("Invalid pattern type");
    }
}
