import {OEmbedEndpoint} from './oembed';

/**
 * The default set of oEmbed provider endpoints.
 *
 * <https://oembed.com> provides a directory of providers, but not all of them
 * work with our oEmbed consumer implementation. Furthermore, including every
 * known provider would increase the bundle size significantly (about 70KiB).
 * As such, we include a small hand-picked set of them.
 */
export const BUILTIN_OEMBED_ENDPOINTS: {[key: string]: OEmbedEndpoint} = {
    'clyp': {
        schemes: [
            'http://clyp.it/*',
            'http://clyp.it/playlist/*',
        ],
        url: 'http://api.clyp.it/oembed/?format=json',
    },
    'deviantart': {
        schemes: [
            'http://*.deviantart.com/art/*',
            'http://*.deviantart.com/*#/d*',
            'http://fav.me/*',
            'http://sta.sh/*'
        ],
        url: 'http://backend.deviantart.com/oembed?format=jsonp',
        format: 'jsonp',
    },
    'soundcloud': {
        schemes: [
            'http://soundcloud.com/*',
            'https://soundcloud.com/*',
        ],
        url: 'https://soundcloud.com/oembed?format=json',
    },
    'vimeo': {
        schemes: [
            'https://vimeo.com/*',
            'https://vimeo.com/album/*/video/*',
            'https://vimeo.com/channels/*/*',
            'https://vimeo.com/groups/*/videos/*',
            'https://vimeo.com/ondemand/*/*',
            'https://player.vimeo.com/video/*'
        ],
        url: 'https://vimeo.com/api/oembed.json',
    },
    // YouTube: Doesn't support CORS or JSONP.
    // Sketchfab: Doesn't support CORS or JSONP.
};
