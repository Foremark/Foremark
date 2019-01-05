import {BUILTIN_MEDIA_HANDLERS, MediaHandler} from './media';

/**
 * Specifies a configuration of the viewer.
 *
 * The viewer loads a configuration object from `window.foremarkViewerConfig`
 * and merges it into the default configuration using the
 * [[loadViewerConfigFromWindow]] function. See [[loadViewerConfigFromWindow]]
 * for how this is exactly done.
 */
export interface ViewerConfig {
    /**
     * Defines a set of media handlers.
     *
     * Each property defines a media handler. Every time a media element is
     * encountered, the media URL is matched against each media handler's
     * URL patterns, and the matching handler will be used to render the media
     * element.
     *
     * `null` can be assigned to a property to disable a specific media handler.
     */
    mediaHandlers: { [key: string]: MediaHandler | null; };
}

/**
 * The default configuration object.
 */
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
    mediaHandlers: BUILTIN_MEDIA_HANDLERS,
};

/**
 * Loads a configuration object from the global scope
 * (`window.foremarkViewerConfig`) and merges it into the default configuration
 * [[DEFAULT_VIEWER_CONFIG]] using the **Merge** operation implemented by
 * [[mergeObjects]].
 */
export function loadViewerConfigFromWindow(): ViewerConfig {
    const userConfig = (window as any).foremarkViewerConfig;
    if (typeof userConfig !== 'undefined') {
        return mergeObjects(DEFAULT_VIEWER_CONFIG, userConfig);
    } else {
        return DEFAULT_VIEWER_CONFIG;
    }
}

/**
 * Performs the **Merge** operations from a source object `add` to a destination
 * object `base`, returns a *new* object (the original objects are not modified).
 *
 * The **Merge** operation iterates through the source object's properties.
 * A property name specifies how the property is transferred to the destination
 * object:
 *
 * - `key` or `key.replace` replaces or creates `destination[key]`.
 * - `key.merge` applies the **Merge** operation on `destination[key]`.
 *   Both of `source[key]` and `destination[key]` must be objects.
 * - `key.append` appends the elements from an array `source[key]` to
 *   `destionation[key]`. Both of `source[key]` and `destination[key]` must be
 *   arrays.
 * - `key.prepend` prepends the elements from an array `source[key]` to
 *   `destionation[key]`. Both of `source[key]` and `destination[key]` must be
 *   arrays.
 * - The processing order is unspecified.
 *
 * A property name optionally include an identifier like `key:ident.merge`.
 * The identifier part is ignored by this operation and only serves to make it
 * possible to have multiple source properties operating on a single destination
 * property. For example, this can be used to prevent one configuration file
 * from overwriting another one's properties:
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ JavaScript
 * // file1.js
 * var foremarkViewerConfig = Object.assign(window.foremarkViewerConfig, {
 *     'mediaHandlers:file1.merge': {
 *         'newhandler1': { ... },
 *     },
 * });
 *
 * // file2.js
 * var foremarkViewerConfig = Object.assign(window.foremarkViewerConfig, {
 *     'mediaHandlers:file2.merge': {
 *         'newhandler2': { ... },
 *     },
 * });
 *
 * // The user-supplied configuration object looks like:
 * {
 *     'mediaHandlers:file1.merge': { newhandler1: { ... }, },
 *     'mediaHandlers:file2.merge': { newhandler2: { ... }, },
 * }
 *
 * // The final configuration object looks like:
 * {
 *     mediaHandlers: {
 *         image: { ... },
 *         newhandler1: { ... },
 *         newhandler2: { ... },
 *     }
 * }
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function mergeObjects(base: any, add: any): any {
    if (typeof base !== 'object' || base == null || typeof add !== 'object' || add == null) {
        throw new Error("Only can merge objects");
    }

    const baseNew = Object.assign({}, base);

    for (let key in add) {
        const [_, ident, mode = 'replace'] =
            /([^:.]+)(?::[^.]*)?(\.(?:merge|append|prepend|replace))?/.exec(key)!;

        switch (mode) {
            case 'replace':
                baseNew[ident] = add[key];
                break;
            case 'merge':
                baseNew[ident] = mergeObjects(baseNew[ident], add[key]);
                break;
            case 'append':
            case 'prepend':
                baseNew[ident] = mergeArrays(baseNew[ident], add[key], mode);
                break;
            default:
                throw new Error();
        }
    }

    return baseNew;
}

function mergeArrays(base: any, add: any, mode: 'append' | 'prepend'): any {
    if (!(base instanceof Array) || !(add instanceof Array)) {
        throw new Error("Only can append/prepend arrays");
    }

    switch (mode) {
        case 'append':
            return base.concat(add);
        case 'prepend':
            return add.concat(base);
        default:
            throw new Error();
    }
}
