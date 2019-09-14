import {BUILTIN_MEDIA_HANDLERS, MediaHandler} from './media';
import {SitemapConfig} from './sitemap';
import {truncateStringWithEllipsisSign} from '../utils/string';
import {escapeXmlText} from '../utils/dom';

/**
 * Specifies a configuration of the viewer.
 *
 * The viewer loads configuration objects from `window.foremarkConfig`
 * and merges it into the default configuration using the
 * [[loadViewerConfigFromWindow]] function. See [[loadViewerConfigFromWindow]]
 * for how this is exactly done and how documents should specify a configuration.
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

    /**
     * Defines a sitemap.
     *
     * When defined, a sitemap will be displayed inside a table of contents
     * pane.
     */
    sitemap?: SitemapConfig;

    /**
     * Specifies a sitemap's document root.
     *
     * A slash sign at the end of the path will be ignored.
     *
     * See [[SitemapEntry]] for details.
     */
    sitemapDocumentRoot?: string;

    /**
     * Enables or disables automatic heading numbering.
     *
     * Defaults to `false`. Set this to `true` to enable automatic heading
     * numbering.
     */
    headingNumbers: boolean;
}

/**
 * The default configuration object.
 */
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
    mediaHandlers: BUILTIN_MEDIA_HANDLERS,
    headingNumbers: false,
};

const CONFIG_TIMEOUT = 10000;

/**
 * Loads configuration objects from the global scope
 * (`window.foremarkConfig`) and merges them into the default configuration
 * [[DEFAULT_VIEWER_CONFIG]] using the **Merge** operation implemented by
 * [[mergeObjects]].
 *
 * The returned promise resolves to two objects:
 *
 *  - The resulting configuration object.
 *  - Zero or more HTML strings each representing an error occured while
 *    processing configuration objects.
 *
 * A document should specify configuration objects using `<script>` tags with
 * an attribute `data-rel="foremark-config"`. Each tag must specify exactly one
 * configuration object.
 *
 * Each script tag provides a configuration object using code like this:
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ JavaScript
 * (window.foremarkConfig = window.foremarkConfig || []).push({
 *     // insert properties here
 *     'mediaHandlers.merge': {
 *         'image.merge': { ... },
 *     },
 * });
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * This function determines if all configuration scripts are loaded by comparing
 * the element count of `foremarkConfig` against the number of `<script>`
 * tags.
 *
 * This is realized by replacing `window.foremarkConfig` with a proxy
 * object which only supports a single operation: `push`.
 */
export async function loadViewerConfigFromWindow(): Promise<[ViewerConfig, string[]]> {
    const [userConfigArray, errors]: [any[], string[]] = await new Promise((resolve) => {
        // Replace the config receiver
        const alreadyLoadedConfigObjects: any[] | undefined = (window as any).foremarkConfig;
        const proxy = new ArrayProxy();
        (window as any).foremarkConfig = proxy;

        // How many configuration objects do we expect?
        const expectedCount = document
            .querySelectorAll('script[data-rel=foremark-config]').length;

        // Proceed when all configs are loaded
        let resolved = false;
        function check() {
            if (resolved) {
                if (proxy.length === expectedCount) {
                    console.error(`Received more config objects than expected (${expectedCount}). ` +
                        `Each script tag with data-rel="foremark-config" must specify exactly one ` +
                        `config object.`);
                }
                return;
            }
            if (proxy.length === expectedCount) {
                resolved = true;
                resolve([proxy.toArray(), []]);
            }
        }
        proxy.onUpdate = check;
        check();

        setTimeout(() => {
            if (resolved) {
                return;
            }
            resolved = true;
            resolve([
                proxy.toArray(),
                [`Loading configuration timed out. ` +
                `${proxy.length} of ${expectedCount} object(s) could be loaded. ` +
                `This is usually caused by a network issue and/or misconfigured config script tags.`],
            ]);
        }, CONFIG_TIMEOUT);

        // Push already-loaded objects
        for (const obj of alreadyLoadedConfigObjects || []) {
            proxy.push(obj);
        }
    });

    // Merge config objects
    let config = DEFAULT_VIEWER_CONFIG;
    for (const userConfig of userConfigArray) {
        try {
            config = mergeObjects(config, userConfig);
        } catch (e) {
            const userConfigStr = truncateStringWithEllipsisSign(JSON.stringify(userConfig), 20);
            errors.push(`An error occured while merging a config object ` +
                `<code>${escapeXmlText(userConfigStr)}</code>': ${escapeXmlText(e)}`);
        }
    }

    return [config, errors];
}

class ArrayProxy<T> {
    private array: T[] = [];

    onUpdate?: () => void;

    get length(): number { return this.array.length; }

    toArray(): T[] { return this.array.slice(0); }

    push(...x: T[]): void {
        this.array.push.apply(this.array, x);
        if (this.onUpdate) {
            this.onUpdate();
        }
    }
}

/**
 * Performs the **Merge** operations from a source object `add` to a destination
 * object `base` (which can be `null`-ish), returns a *new* object (the original
 * objects are not modified).
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
 * (window.foremarkConfig = window.foremarkConfig || []).push({
 *     'mediaHandlers:file1.merge': {
 *         'newhandler1': { ... },
 *     },
 * });
 *
 * // file2.js
 * (window.foremarkConfig = window.foremarkConfig || []).push({
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
export function mergeObjects(base: any, add: any): any {
    if (base == null) {
        base = {};
    }
    if (typeof base !== 'object' || base == null || typeof add !== 'object' || add == null) {
        throw new Error("Only can merge objects");
    }

    const baseNew = Object.assign({}, base);

    for (let key in add) {
        const [_, ident, mode = '.replace'] =
            /([^:.]+)(?::[^.]*)?(\.(?:merge|append|prepend|replace))?/.exec(key)!;

        switch (mode) {
            case '.replace':
                baseNew[ident] = add[key];
                break;
            case '.merge':
                baseNew[ident] = mergeObjects(baseNew[ident], add[key]);
                break;
            case '.append':
            case '.prepend':
                baseNew[ident] = mergeArrays(baseNew[ident], add[key], mode);
                break;
            default:
                throw new Error();
        }
    }

    return baseNew;
}

function mergeArrays(base: any, add: any, mode: '.append' | '.prepend'): any {
    if (!(base instanceof Array) || !(add instanceof Array)) {
        throw new Error("Only can append/prepend arrays");
    }

    switch (mode) {
        case '.append':
            return base.concat(add);
        case '.prepend':
            return add.concat(base);
        default:
            throw new Error();
    }
}
