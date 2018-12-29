import {MediaHandler} from './index';

interface IFrameMediaOptions {
    pattern: RegExp;
    frameUrl: string;
}

/**
 * Creates a `MediaHandler` that displays an inline frame using a media URL
 * transformation rule.
 *
 * For a media URL `x`, the frame URL is `x.replace(pattern, frameUrl)`.
 */
export function createIFrameMediaHandler(
    priority: number,
    pattern: RegExp,
    frameUrl: string,
): MediaHandler {
    return {
        patterns: [matchIFrameMedia],
        handler: handleIFrameMedia,
        options: {
            pattern,
            frameUrl,
        } as IFrameMediaOptions,
        priority,
    };
}

function matchIFrameMedia(url: string, options: unknown): boolean {
    const opt = options as IFrameMediaOptions;

    return opt.pattern.test(url);
}

function handleIFrameMedia(e: Element, options: unknown): void {
    const opt = options as IFrameMediaOptions;

    const src = e.getAttribute('src')!;
    const frameUrl = src.replace(opt.pattern, opt.frameUrl);

    const iframe = e.ownerDocument!.createElement('iframe');

    iframe.setAttribute('src', frameUrl);
    iframe.setAttribute('height', '360');
    iframe.setAttribute('width', '640');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'allowfullscreen');
    iframe.setAttribute('webkitallowfullscreen', 'webkitallowfullscreen');
    iframe.setAttribute('mozallowfullscreen', 'mozallowfullscreen');
    iframe.setAttribute('allow', 'autoplay; fullscreen; vr');

    let attrs = e.attributes;
    for (let i = 0, c = attrs.length; i < c; ++i) {
        if (attrs[i].name === 'src') {
            continue;
        }
        iframe.setAttribute(attrs[i].name, attrs[i].value);
    }

    e.parentElement!.insertBefore(iframe, e);
    e.parentElement!.removeChild(e);
}
