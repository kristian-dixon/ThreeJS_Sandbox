const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(wgsl|glsl|fs|vs)$/i,
          loader: 'raw-loader',
          options: {
            esModule: false,
          },
        },
        {
          test: /\.(png|hdr|svg|jpg|jpeg|gif|ogg|mp3|wav|glb)$/i,
          use:[
            {
              loader:'file-loader',
            },
          ]
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [new HtmlWebpackPlugin({
        template: "./index.html",
    })],
  };