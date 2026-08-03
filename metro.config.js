const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep Jest / Maestro / docs / store fixtures / Cloud Functions out of the client bundle graph.
config.resolver.blockList = [
  /[\\/]__tests__[\\/].*/,
  /[\\/]\.maestro[\\/].*/,
  /[\\/]docs[\\/].*/,
  /[\\/]store[\\/]screenshots[\\/].*/,
  /[\\/]functions[\\/].*/,
  /[\\/]canvases[\\/].*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
