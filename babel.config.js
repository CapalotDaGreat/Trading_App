module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(() => isTest);

  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
