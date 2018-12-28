import {BUILTIN_MEDIA_HANDLERS, MediaHandler} from './media';

export interface ViewerConfig {
    mediaHandlers: { [key: string]: MediaHandler | null; };
}

export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
    mediaHandlers: BUILTIN_MEDIA_HANDLERS,
};

export function loadViewerConfigFromWindow(): ViewerConfig {
    const userConfig = (window as any).foremarkViewerConfig;
    if (typeof userConfig !== 'undefined') {
        return mergeObjects(DEFAULT_VIEWER_CONFIG, userConfig);
    } else {
        return DEFAULT_VIEWER_CONFIG;
    }
}

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
