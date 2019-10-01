module.exports = {
  configureWebpack: {
    target: 'node-webkit',
  },
  chainWebpack: (config) => {
    config.entry('main').add('./src/main.js');
  },
};
