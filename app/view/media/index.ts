// This module defines built-in media handlers.
import {ViewerConfig} from '../config';
import {TagNames} from '../../foremark';
import {Pattern, patternMatches} from '../../utils/pattern';
import {escapeXmlText} from '../../utils/dom';
import {handleAudioMedia, handleImageMedia, handleVideoMedia} from './html5';
import {OEMBED_MEDIA_HANDLER} from './oembed';

export interface MediaHandler {
    /**
     * Describes the pattern of a media URL. This media handler will be used if
     * any of the specified patterns match a media URL.
     */
    patterns: ReadonlyArray<Pattern<unknown>> | null;

    /**
     * A function used to process a media element.
     */
    handler: (e: Element, options?: unknown) => void | PromiseLike<void>;

    options?: unknown;

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
    'video': {
        patterns: [/\.(mp4|m4v|ogm|ogv|avi|pg|mov|wmv|webm)$/i],
        handler: handleVideoMedia,
        priority: 20,
    },
    'audio': {
        patterns: [/\.(mp3|ogg|oga|spx|wav|au|opus|m4a|wma)$/i],
        handler: handleAudioMedia,
        priority: 10,
    },
    'oembed': OEMBED_MEDIA_HANDLER,
};

export async function processMediaElement(e: Element, config: ViewerConfig): Promise<void> {
    const src = e.getAttribute('src');
    if (!src) {
        e.outerHTML = `<${TagNames.Error}>` +
            `<code>&lt;${TagNames.Media}&gt;</code>: missing <code>src</code>` +
        `</${TagNames.Error}>`;
        return;
    }

    try {
        let bestHandler: MediaHandler | null = null;

        for (const key in config.mediaHandlers) {
            const handler = config.mediaHandlers[key];
            if (
                handler && (
                    handler.patterns == null ||
                    handler.patterns.find(e => patternMatches(src, e, handler.options))
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

        await bestHandler.handler(e, bestHandler.options);
    } catch (error) {
        e.outerHTML = `<${TagNames.Error}>` +
            `<code>&lt;${TagNames.Media}&gt;</code>: processing failed ` +
            `for media URL <code>${escapeXmlText(src)}</code>: ` +
            `<code>${escapeXmlText(String(error))}</code>: ` +
        `</${TagNames.Error}>`;
        return;
    }
}
