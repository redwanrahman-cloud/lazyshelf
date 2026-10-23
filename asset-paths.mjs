export function assetPaths(moduleUrl) {
  return {
    runtime: new URL('./assets/runtime/transformers.js', moduleUrl).href,
    models: new URL('./assets/model/', moduleUrl).href,
    wasm: new URL('./assets/runtime/', moduleUrl).href,
  };
}
