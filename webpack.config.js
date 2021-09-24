const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'scm.min.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'SCM',
  },
};
