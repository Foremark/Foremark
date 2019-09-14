import {escapeXmlText} from '../utils/dom';

/**
 * Represents a sitemap.
 *
 * Each property defines a sitemap fragment. A property named `main` will
 * be used as root entries. Entries can refer to other fragments using
 * their property names.
 */
export interface SitemapConfig {
    main: SitemapConfigFragment;
    [key: string]: SitemapConfigFragment | null;
}

/**
 * Represents a sitemap fragment.
 *
 * A sitemap fragment is a list of zero or more sitemap entries.
 */
export type SitemapConfigFragment = (SitemapConfigEntry | SitemapConfigEntryCompact)[];

/**
 * Represents a sitemap entry. An entry is a reference to a document.
 *
 * # Path
 *
 * Each entry is associated with one or more **paths**. A path is a
 * slash-separated string that looks like `/foo/bar.mf.xhtml` and signifies the
 * document's relative position to **the document root**.
 *
 * When navigating to an entry, **the canonical path** will be used to determine
 * the URI of the corresponding document.
 *
 * The origin of sitemap paths is called document root. When a document is
 * displayed, the viewer guesses the document root as well as the current
 * sitemap entry by comparing the URI of the current document against all of
 * the sitemap entries' paths. The sitemap will not be displayed if the document
 * root cannot be determined. [[ViewerConfig.sitemapDocumentRoot]] can be used
 * to specify a document root explicitly.
 *
 * A sitemap will not be displayed either if the current document is not
 * located in the sitemap.
 *
 * # Disabled entry
 *
 * An entry is disabled if it doesn't have a path. An disabled entry is not
 * associated to any document but is still displayed.
 *
 * ``` JavaScript
 * [
 *     ['Chapter 1', ['/chapter-1.mf.xhtml']],
 *     ['Chapter 2', ['/chapter-2.mf.xhtml']],
 *     ['Chapter 3', []], // incomplete
 *     ['Appendix', [], [
 *         ['Appendix A', ['appendix/a.mf.xhtml']],
 *         ['Appendix B', ['appendix/b.mf.xhtml']],
 *     ]],
 * ]
 * ```
 *
 * # Shorthand
 *
 * `SitemapConfigEntry` can be written shorter by using a tuple
 * ([[SitemapConfigEntryCompact]]). For example, the following two entry
 * definitions are equivalent:
 *
 * ``` JavaScript
 * const entry = {
 *     caption: 'The Foremark Book',
 *     paths: ['/book.mf.xhtml'],
 * };
 * const entryShort = ['The Foremark Book', ['/book.mf.xhtml']];
 * ```
 */
export interface SitemapConfigEntry {
    /** The XHTML markup of an entry caption. */
    caption: string;

    /**
     * An array containing the paths of a sitemap entry. It can be empty.
     * If it is not empty, the first element will be treated as the canonical
     * path.
     *
     * Each element can be an absolute path (e.g., `/foo/bar.mf.xhtml`) or a
     * relative path (e.g., `foo/bar.mf.xhtml`). The latter is relative to
     * the canonical path of the nearestor ancestor entry having a canonical
     * path.
     */
    paths: string[];

    /**
     * An optional sitemap fragment or fragment name representing the children
     * of a sidemap entry.
     *
     * It's ignored if it refers to an undefined fragment name.
     */
    children?: SitemapConfigFragment | string;
}

/**
 * A compact version of [[SitemapConfigEntry]].
 */
export interface SitemapConfigEntryCompact extends Array<any> {
    /** Maps to [[SitemapConfigEntry.caption]]. */
    0: string;
    /** Maps to [[SitemapConfigEntry.paths]]. */
    1: string[];
    /** Maps to [[SitemapConfigEntry.children]]. */
    2?: SitemapConfigFragment | string;
}

/**
 * A processed sitemap.
 */
export interface Sitemap {
    rootEntries: ReadonlyArray<SitemapEntry>;
    currentEntry: SitemapEntry;
    documentRoot: string;
}

/**
 * A processed sitemap entry.
 */
export interface SitemapEntry {
    caption: HTMLDivElement;
    paths: string[];
    children: ReadonlyArray<SitemapEntry>;
}

/**
 * Processes a sitemap config.
 */
export function processSitemap(config?: SitemapConfig, documentRoot?: string): [Sitemap | null, string[]] {
    if (!config) {
        return [null, []];
    }

    const errors: string[] = [];

    const rootEntries = expandSitemap(config, errors, document);
    let currentEntry: SitemapEntry | null = null;

    const docPath = /^[^?#]*/.exec(`${document.location}`)![0]
        .toLowerCase()
        .replace(/\\/g, '/');

    if (!documentRoot) {
        // Guess the document root
        let bestPathLen = -1;
        forEachEntry(rootEntries, e => {
            for (const path of e.paths) {
                if (docPath.endsWith(path.toLowerCase()) && path.length > bestPathLen) {
                    bestPathLen = path.length;
                    currentEntry = e;
                }
            }
        });

        if (!currentEntry) {
            errors.push("Document root could not be determined.");
            return [null, errors];
        }

        documentRoot = docPath.substr(0, docPath.length - bestPathLen);
    } else {
        if (documentRoot.endsWith('/')) {
            documentRoot = documentRoot.substr(0, documentRoot.length - 1);
        }

        // Determine the entry corresponding to the current document
        forEachEntry(rootEntries, e => {
            for (const path of e.paths) {
                if (docPath === documentRoot + path.toLowerCase()) {
                    currentEntry = e;
                }
            }
        });

        if (!currentEntry) {
            errors.push("The current document is not located inside the sitemap");
            return [null, errors];
        }
    }

    return [
        {
            rootEntries,
            currentEntry,
            documentRoot,
        },
        errors,
    ];
}

function forEachEntry(list: ReadonlyArray<SitemapEntry>, cb: (e: SitemapEntry) => void): void {
    for (const e of list) {
        cb(e);
        forEachEntry(e.children, cb);
    }
}

export function expandSitemap(config: SitemapConfig, errors: string[], document: HTMLDocument): ReadonlyArray<SitemapEntry> {
    const activeFragments: string[] = [];

    function scanFragment(
        ref: SitemapConfigFragment | string | undefined,
        originPath?: string,
    ): ReadonlyArray<SitemapEntry> {
        if (!ref) {
            return [];
        } else if (typeof ref === 'string') {
            // Fragment reference
            const frag = config[ref];
            if (!frag) {
                return [];
            } else {
                if (activeFragments.indexOf(ref) >= 0) {
                    errors.push(`Found a circular fragment reference: ` +
                        escapeXmlText(activeFragments.join('→') + '→' + ref));
                    return [];
                }
                activeFragments.push(ref);
                const ret = scanFragment(frag);
                activeFragments.pop();
                return ret;
            }
        } else if (!(ref instanceof Array)) {
            errors.push(`<code>children</code> has an invalid type.`);
            return [];
        } else {
            return ref.map(entry => {
                if (entry instanceof Array) {
                    // Shorthand
                    entry = entry as SitemapConfigEntryCompact;

                    if (entry.length < 2) {
                        errors.push(`Entry <code>${escapeXmlText(JSON.stringify(entry))}</code> ` +
                            `has too few elements.`);
                    }

                    entry = {
                        caption: entry[0],
                        paths: entry[1],
                        children: entry[2],
                    } as SitemapConfigEntry;
                }

                let paths = entry.paths;
                if (!(paths instanceof Array)) {
                    errors.push(`<code>paths</code> of <code>${escapeXmlText(entry.caption)}</code> ` +
                        `is not an array.`);
                    paths = [];
                }

                paths = originPath ?
                    entry.paths.map(p => resolvePath(errors, originPath, p)) :
                    entry.paths.map(p => resolvePath(errors, p));

                return {
                    caption: createCaption(entry.caption, errors, document),
                    paths,
                    children: scanFragment(entry.children, paths[0] || originPath),
                } as SitemapEntry;
            });
        }
    }

    if (!(config.main instanceof Array)) {
        errors.push(`<code>main</code> is not an array`);
        return [];
    }

    return scanFragment(config.main);
}

function createCaption(caption: string, errors: string[], document: HTMLDocument): HTMLDivElement {
    if (typeof caption !== 'string') {
        errors.push(`<code>captio</code> is not a string: ` +
            `<code>${escapeXmlText(JSON.stringify(caption))}</code>`);
    }
    const element = document.createElement('div');
    try {
        element.innerHTML = caption;
    } catch (e) {
        errors.push(`Failed to process HTML: <code>${escapeXmlText(caption)}</code>`);
        element.innerText = caption;
    }
    return element;
}

function resolvePath(errors: string[], ...paths: string[]): string {
    let components: string[] | null = null;
    for (const c of paths) {
        if (c.startsWith('/')) {
            components = c.substr(1).split('/');
        } else {
            if (components == null) {
                errors.push(
                    `Can't specify a relative path <code>${escapeXmlText(c)}</code> ` +
                    `without a base path.`);
                components = [];
            }
            components.pop();
            for (const part of c.split('/')) {
                if (part === '.') {
                } else if (part === '..') {
                    components.pop();
                } else {
                    components.push(part);
                }
            }
        }
    }
    return '/' + components!.join('/');
}

