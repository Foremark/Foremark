// This module defines built-in media handlers.
import {ViewerConfig} from './config';
import {TagNames} from '../foremark';
import {Pattern, patternMatches} from '../utils/pattern';
import {escapeXmlText} from '../utils/dom';

export interface MediaHandler {
    /**
     * Describes the pattern of a media URL. This media handler will be used if
     * any of the specified patterns match a media URL.
     */
    patterns: ReadonlyArray<Pattern> | null;

    /**
     * A function used to process a media element.
     */
    handler: (e: HTMLElement) => void;

    /**
     * If there are multiple matching media handlers, the one with the highest
     * priority value will be chosen.
     */
    priority: number;
}

/**
 * Defines built-in media handlers.
 */
export const BUILTIN_MEDIA_HANDLERS = {
    'image': {
        patterns: null,
        handler: handleImageMedia,
        priority: 0,
    },
};

export function processMediaElement(e: Element, config: ViewerConfig): void {
    const src = e.getAttribute('src');
    if (!src) {
        e.outerHTML = `<${TagNames.Error}>` +
            `<code>&lt;${TagNames.Media}&gt;</code>: missing <code>src</code>` +
        `</${TagNames.Error}>`;
        return;
    }

    let bestHandler: MediaHandler | null = null;

    for (const key in config.mediaHandlers) {
        const handler = config.mediaHandlers[key];
        if (
            handler && (
                handler.patterns == null ||
                handler.patterns.find(e => patternMatches(src, e))
            ) &&
            handler.priority >
                (bestHandler ? bestHandler.priority : Number.NEGATIVE_INFINITY)
        ) {
            bestHandler = handler;
        }
    }

    if (!bestHandler) {
        e.outerHTML = `<${TagNames.Error}>` +
            `<code>&lt;${TagNames.Media}&gt;</code>: no matching media handler ` +
            `for media URL <code>${escapeXmlText(src)}</code>` +
        `</${TagNames.Error}>`;
        return;
    }

    bestHandler.handler(e);
}

function handleImageMedia(e: Element): void {
    const img = e.ownerDocument!.createElement('img');

    let attrs = e.attributes;
    for (let i = 0, c = attrs.length; i < c; ++i) {
        img.setAttribute(attrs[i].name, attrs[i].value);
    }

    e.parentElement!.insertBefore(img, e);
    e.parentElement!.removeChild(e);
}
