const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Block only a path under this project root (not similarly named deps in node_modules). */
function blockProjectDir(relativeDir) {
  const absolute = path.resolve(__dirname, relativeDir);
  return new RegExp(`^${escapeRegExp(absolute)}[/\\\\].*`);
}

// Keep Jest / Maestro / docs / store fixtures / Cloud Functions out of the client bundle graph.
// IMPORTANT: do not use a bare `/functions/` pattern — that also matches
// `node_modules/firebase/functions` and breaks Expo Go bundling.
config.resolver.blockList = [
  /[\\/]__tests__[\\/].*/,
  blockProjectDir('.maestro'),
  blockProjectDir('docs'),
  blockProjectDir(path.join('store', 'screenshots')),
  blockProjectDir('functions'),
  blockProjectDir('canvases'),
];

module.exports = withNativeWind(config, { input: './global.css' });
