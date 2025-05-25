const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './src/background.ts',
    popup: './src/popup.ts',
    content: './src/content.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    // Load environment variables from .env files
    new Dotenv({
      path: '.env', // Path to .env file (default)
      safe: true, // Load .env.example as a fallback (optional)
      systemvars: true, // Load system environment variables as well
      defaults: false, // Don't load .env.defaults
    }),
    // Define process.env if it doesn't exist in the client
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
  ],
}; 