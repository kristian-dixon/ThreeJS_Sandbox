const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = (env,argv) => {
  const isProduction = argv.mode === 'production'
  return{
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    
    devtool : isProduction ? false : 'eval-source-map',

    module: {
       rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // 3. Webpack 5 replacement for raw-loader
        {
          test: /\.(wgsl|glsl|fs|vs)$/i,
          type: 'asset/source',
        },
        // 4. Webpack 5 replacement for file-loader
        {
          test: /\.(png|hdr|svg|jpg|jpeg|gif|ogg|mp3|wav|glb)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[hash][ext][query]'
          }
        }
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },

    output: {
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      path: path.resolve('C:/_Projects/Personal/Web/Website/Extra/ThreeJS'),
      clean: true,
    },


    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

 plugins: [
      new HtmlWebpackPlugin({
        template: "./index.html",
        // Minify HTML output in production
        minify: isProduction ? {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
        } : false,
      })
    ],
  };
};