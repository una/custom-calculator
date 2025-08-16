const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: './src/service-worker.js',
          swDest: 'service-worker.js',
        }),
      ],
    },
  },
};
