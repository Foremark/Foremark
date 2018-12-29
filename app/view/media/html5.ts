
export function handleImageMedia(e: Element): void {
    const img = e.ownerDocument!.createElement('img');

    let attrs = e.attributes;
    for (let i = 0, c = attrs.length; i < c; ++i) {
        img.setAttribute(attrs[i].name, attrs[i].value);
    }

    e.parentElement!.insertBefore(img, e);
    e.parentElement!.removeChild(e);
}

export function handleVideoMedia(e: Element): void {
    const img = e.ownerDocument!.createElement('video');

    img.setAttribute('controls', 'controls');

    let attrs = e.attributes;
    for (let i = 0, c = attrs.length; i < c; ++i) {
        img.setAttribute(attrs[i].name, attrs[i].value);
    }

    e.parentElement!.insertBefore(img, e);
    e.parentElement!.removeChild(e);
}

export function handleAudioMedia(e: Element): void {
    const img = e.ownerDocument!.createElement('audio');

    img.setAttribute('controls', 'controls');

    let attrs = e.attributes;
    for (let i = 0, c = attrs.length; i < c; ++i) {
        img.setAttribute(attrs[i].name, attrs[i].value);
    }

    e.parentElement!.insertBefore(img, e);
    e.parentElement!.removeChild(e);
}
