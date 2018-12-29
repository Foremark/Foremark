import * as fetchJsonp from 'fetch-jsonp';

import {MediaHandler} from './index';
import {BUILTIN_OEMBED_ENDPOINTS} from './oembed-providers';
import {escapeRegExp} from '../../utils/string';
import {escapeXmlText, legalizeXML} from '../../utils/dom';

export interface OEmbedEndpoint {
    /**
     * URL scheme of the API endpoint. The syntax follows
     * "2.1. Configuration" of the oEmbed specification - each string may
     * contain one or more wildcards.
     */
    schemes: string[];

    /**
     * The API endpoint.
     */
    url: string;

    /**
     * The expected response format of the endpoint. Defaults to `json` when
     * omitted.
     */
    format?: 'json' | 'jsonp';
}

export interface OEmbedOptions {
    endpoints: { [key: string]: OEmbedEndpoint | null; };
}

interface OEmbedProcessedOptions extends OEmbedOptions {
    /** Pairs of `RegExp` and `OEmbedEndpoint`. */
    endpointsREs: [RegExp, OEmbedEndpoint][];

    endpointExhaustiveRE: RegExp;
}

/**
 * Modifies an `OEmbedOptions`-like object for faster processing, and returns
 * the modified object.
 *
 * Maybe throws an exception if a given object is not a valid `OEmbedOptions`.
 */
function processOptions(options: unknown): OEmbedProcessedOptions {
    if (typeof options !== 'object' || options == null) {
        throw new TypeError("Options must be an object.");
    }

    const opt = options as OEmbedProcessedOptions;
    if (typeof opt.endpoints !== 'object' || opt.endpoints == null) {
        throw new TypeError("`endpoints` must be an object.");
    }

    if (opt.endpointsREs) {
        // Already processed
        return opt;
    }

    opt.endpointsREs = [];

    for (let key in opt.endpoints) {
        const endpoint = opt.endpoints[key];
        if (!endpoint) {
            continue;
        }
        Object.freeze(endpoint);

        // Convert oEmbed URL scheme to a `RegExp`
        const pattern = endpoint.schemes
            .map(x => '^' + escapeRegExp(x).replace(/\\\*/g, '.*') + '$')
            .join('|');

        opt.endpointsREs.push([new RegExp(pattern), endpoint]);
    }

    opt.endpointExhaustiveRE = new RegExp(
        opt.endpointsREs
            .map(r => r[0].source)
            .join('|')
    );

    Object.freeze(opt);
    Object.freeze(opt.endpoints);

    return opt;
}

interface OEmbedResponseCommon {
    version: '1.0',
    title?: string;
    author_name?: string;
    author_url?: string;
    provider_name?: string;
    provider_url?: string;
    cache_age?: number;
    thumbnail_url?: string;
    thumbnail_width?: number;
    thumbnail_height?: number;
};
type OEmbedResponse = OEmbedResponseCommon & (
    {
        type: 'photo';
        url: string;
        width: number;
        height: number;
    } | {
        type: 'video';
        html: string;
        width: number;
        height: number;
    } | {
        type: 'rich';
        html: string;
        width: number;
        height: number;
    } | {
        type: 'link'
    }
);

export const OEMBED_MEDIA_HANDLER: MediaHandler = {
    options: {
        endpoints: BUILTIN_OEMBED_ENDPOINTS,
    } as OEmbedOptions,
    priority: 100,

    patterns: [
        (url, options) => {
            const opt = processOptions(options);
            return opt.endpointExhaustiveRE.test(url);
        },
    ],

    handler: async (element, options) => {
        const opt = processOptions(options);
        const src = element.getAttribute('src')!;

        // Find the endpoint that can handle the given URL
        const ep = opt.endpointsREs.find(([re, _]) => re.test(src))![1];

        // Create a request
        const [_, urlbase, query] = /([^?]*)(?:\?(.*))?/.exec(ep.url)!;
        const queries = query ? query.split('?') : [];

        queries.push('url=' + encodeURIComponent(src));

        for (let attrs = element.attributes, i = 0; i < attrs.length; ++i) {
            const attr = attrs[i];
            if (attr.name.startsWith('oembed-')) {
                queries.push(encodeURIComponent(attr.name.substr(7)) + '=' +
                    encodeURIComponent(attr.value));
            }
        }

        const url = urlbase + '?' + queries.join('&');

        // Send the request
        let resp: OEmbedResponse;
        switch (ep.format || 'json') {
            case 'json':
                resp = await (await fetch(url)).json();
                break;
            case 'jsonp':
                resp = await (await fetchJsonp(url)).json();
                break;
            default:
                throw new Error(`Unknown oEmbed response format: ${ep.format}`);
        }

        switch (resp.type) {
            case 'rich':
            case 'video':
                try {
                    element.innerHTML = legalizeXML(resp.html);
                } catch (e) {
                    throw new Error(`Could not deserialize a supplied XHTML markup: ${resp.html}`);
                }
                break;
            case 'link':
                element.outerHTML = `<a href="${escapeXmlText(src)}">` +
                    escapeXmlText(resp.title || src) +
                    `</a>`;
                break;
            case 'photo':
                const img = element.ownerDocument!.createElement('img');
                img.src = resp.url;
                img.alt = img.title = '"' + resp.title + '"' +
                    (resp.author_name ? ` (by ${resp.author_name})` : '');

                const a = element.ownerDocument!.createElement('a');;
                a.href = src;

                element.parentElement!.insertBefore(a, element);
                element.parentElement!.removeChild(element);

                a.appendChild(img);
                break;
            default:
                throw new Error(`Unknown oEmbed response type: ${(resp as any).type}`);
        }
    },
};
