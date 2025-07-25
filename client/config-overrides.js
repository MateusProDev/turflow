const path = require('path');

module.exports = function override(config, env) {
  // Otimizações de performance
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  };

  // Configurações de cache
  if (env === 'production') {
    config.optimization.minimize = true;
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;
  }

  // Alias para imports mais rápidos
  config.resolve.alias = {
    ...config.resolve.alias,
    '@components': path.resolve(__dirname, 'src/components'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@context': path.resolve(__dirname, 'src/context'),
    '@pages': path.resolve(__dirname, 'src/pages'),
  };

  return config;
};
