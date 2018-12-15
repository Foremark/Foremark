// Manages lazy loaded modules.
import {Signal} from '../utils/signal';
import {Lazy} from '../utils/lazy';

/** Signaled when the state of the loader was updated. */
export const onLoaderUpdate = new Signal<void>();

/** Returns whether the loader is currently loading a module. */
export const isLoaderActive = () => modulesInProgress.length > 0;

// TODO: Display a spinner using this API

let loaderHighlightJS: () => Promise<typeof import('../../lib/highlight')>;
let loaderKatex: () => Promise<typeof import('../../lib/katex')>;
let loaderDiagram0: () => Promise<typeof import('../../lib/diagram')>;

if (process.env.LAZY_LOADING) {
    loaderHighlightJS = () => import(/* webpackChunkName: 'hljs' */ '../../lib/highlight');
    loaderKatex = () => import(/* webpackChunkName: 'katex' */ '../../lib/katex');
    loaderDiagram0 = () => import(/* webpackChunkName: 'diagram' */ '../../lib/diagram');
} else {
    loaderHighlightJS = () => Promise.resolve(require('../../lib/highlight'));
    loaderKatex = () => Promise.resolve(require('../../lib/katex'));
    loaderDiagram0 = () => Promise.resolve(require('../../lib/diagram'));
}

const loaderDiagram = () => loaderDiagram0().then(m => m.promise);

const loaders = [
    loaderHighlightJS,
    loaderKatex,
    loaderDiagram,
];

const modulesInProgress: number[] = [];

const initiators = loaders.map((loader: () => Promise<any>, key) => {
    const lazy = new Lazy(() => {
        // Start loading the module.
        modulesInProgress.push(key);
        onLoaderUpdate.invoke(null, void 0);

        const rawModulePromise = loader();

        return rawModulePromise.then(mod => {
            // Report back the completion.
            const i = modulesInProgress.indexOf(key);
            modulesInProgress.splice(i, 1);
            onLoaderUpdate.invoke(null, void 0);

            return mod;
        });
    });
    return () => lazy.value;
});

/** Lazily loadable modules. */
export const lazyModules = {
    highlightJS: initiators[0] as typeof loaderHighlightJS,
    katex: initiators[1] as typeof loaderKatex,
    diagram: initiators[2] as typeof loaderDiagram,
};
