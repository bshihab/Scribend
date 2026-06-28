module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // executorch's dep (zod v4) uses `export * as ns` — Metro's preset needs this to bundle it.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
