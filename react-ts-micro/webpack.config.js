const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const package = require('./package.json');
const resolve = dir => path.resolve(__dirname, dir);

module.exports = (env, argv) => {
  // 判断是否开发模式
  const { mode = 'production' } = argv;
  const isDev = mode !== 'production';

  return {
    mode: 'development',
    devServer: {
      port: 6001,
      host: '0.0.0.0',
    },
    output: {
      filename: isDev ? '[name].js' : '[name]_[chunkhash:8].js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@': resolve('src')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts(x)$/,
          loader: 'ts-loader',
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 2,
              },
            },
            {
              loader: 'postcss-loader'
            },
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader'
            }
          ]
        },
        {
          test: /\.(png|jpg|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
          }
        }
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'baseMicro',
        library: { type: 'var', name: 'baseMicro' },
        filename: isDev ? 'remoteEntry.js' : `remoteEntry_${package.version}.js`,
        exposes: {
          './common.css': './src/asset/css/common.scss',
          './urlUtil': './src/util/url.tsx',
          './Button': './src/component/button/index.tsx',
        },
        shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],
  };

}

