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
    'codepen': {
        schemes: [
            'http://codepen.io/*',
            'https://codepen.io/*',
        ],
        url: 'http://codepen.io/api/oembed?format=js',
        format: 'jsonp',
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
    'facebook-post': {
        schemes: [
            'https://www.facebook.com/*/posts/*',
            'https://www.facebook.com/photos/*',
            'https://www.facebook.com/photo.php',
            'https://www.facebook.com/*/activity/*',
            'https://www.facebook.com/permalink.php',
            'https://www.facebook.com/media/set?set=*',
            'https://www.facebook.com/questions/*',
            'https://www.facebook.com/notes/*/*/*',
        ],
        url: 'https://www.facebook.com/plugins/post/oembed.json',
        format: 'jsonp',
    },
    'facebook': {
        schemes: [
            'https://www.facebook.com/*/videos/*',
            'https://www.facebook.com/video.php',
        ],
        url: 'https://www.facebook.com/plugins/video/oembed.json',
        format: 'jsonp',
    },
    'mixcloud': {
        schemes: [
            'http://www.mixcloud.com/*/*/',
            'https://www.mixcloud.com/*/*/',
        ],
        url: 'https://www.mixcloud.com/oembed/?format=json',
        format: 'jsonp',
    },
    'slideshare': {
        schemes: [
            'https://www.slideshare.net/*/*',
            'https://fr.slideshare.net/*/*',
            'https://de.slideshare.net/*/*',
            'https://es.slideshare.net/*/*',
            'https://pt.slideshare.net/*/*',
        ],
        url: 'https://www.slideshare.net/api/oembed/2?format=json',
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
    // Reddit: Doesn't support CORS or JSONP.
    // YouTube: Doesn't support CORS or JSONP.
    // Sketchfab: Doesn't support CORS or JSONP.
};
