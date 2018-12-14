// I'm not willing to link immutable.js and add 50KB to the output bundle, so
// here it is.

/**
 * Searches and removes a given element from an array, returning the
 * result as a new array. Returns the original array if the element wasn't
 * found.
 */
export function arrayRemoveElement<T>(a: ReadonlyArray<T>, x: T): ReadonlyArray<T> {
    const i = a.indexOf(x);
    if (i < 0) {
        return a;
    } else {
        return a.slice(0, i).concat(a.slice(i + 1));
    }
}
