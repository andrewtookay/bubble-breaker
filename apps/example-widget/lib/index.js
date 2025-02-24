import 'systemjs-webpack-interop/auto-public-path';
/**
 * Optional method that will be called for every app and widget right after the
 * layout config and plugins are loaded but before the `register` function
 * Useful to interact with the plugins before registering the app (ex. fire notification events)
 * @returns void
 */
export const initialize = (props) => {
    return;
};
/**
 * The register function is called right after the `initialize` function
 * This method is required for apps and widgets
 * @returns WidgetInterface
 */
export const register = (props) => {
    return {
        loadingFn: () => import('./components'),
        activeWhen: () => true,
        mountsIn: props.layoutConfig.rootWidgetSlotId,
    };
};
/**
 * Applications and widgets can provide additional functionalities via plugins.
 * As an example, the ENS app can provide additional functionalities like address lookup via plugins.
 * Plugins are namespaced with the widget's or app's name.
 * Warning: plugins cannot use other plugins
 */
export const getPlugin = async () => {
    return {
        saveLocalData(key, data) {
            localStorage.setItem(key, data);
        },
        getLocalData(key) {
            return localStorage.getItem(key);
        },
    };
};
//# sourceMappingURL=index.js.map