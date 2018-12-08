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
