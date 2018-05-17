const extend = require('../../web/webpack.js');

module.exports = base => {
  base.module.rules = [...base.module.rules, ...extend.module.rules];
  base.resolve.alias = {
    ...base.resolve.alias,
    ...extend.resolve.alias,
    '@storybook/react-native': '@storybook/react',
  };
  base.resolve.extensions = [...base.resolve.extensions, '.web.js', '.js'];
  base.devtool = false;
  return base;
};
