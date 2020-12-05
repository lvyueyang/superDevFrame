const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { ProgressPlugin, DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const babelOptions = require('./babel.config');

const SRC_PATH = path.join(__dirname, './src');
const PAGE_PATH = path.join(SRC_PATH, 'pages');
const port = 9000;
console.log('=======================================================================================');
console.log(`   启动中....`);
console.log('=======================================================================================');

function initEntry(env) {
  let includesPages = env.include?.split(',') || [];
  let pages = fs.readdirSync('./src/pages');
  if (env.development && env.include) {
    pages = pages.filter(page => includesPages.includes(page));
    console.log(`   当前只编译 ${env.include} 页面`);
    console.log('=======================================================================================');
  }
  const entry = {};
  const htmlWebpackPlugins = [];
  for (let page of pages) {
    const entryHtml = path.join(PAGE_PATH, `${page}/index.html`);
    const entryJs = path.join(PAGE_PATH, `${page}/index.js`);
    const isHtmlExist = fse.pathExistsSync(entryHtml);
    // 之所以不判断 js 是为了用报错做提醒用
    if (isHtmlExist) {
      if (!entryJs) {
        throw `${page} 缺少 index.js 文件`
      }
      entry[page] = `./src/pages/${page}/index.js`;
      htmlWebpackPlugins.push(new HtmlWebpackPlugin({
        filename: `${page}/index.html`,
        template: entryHtml,
        chunks: [page],
        minify: false,
      }))
      if (env.development && includesPages.includes(page)) {

      }
    }
  }

  return {
    entry,
    htmlWebpackPlugins
  }
}

module.exports = (env) => {
  if (!env) env = {};
  env.development = process.env.NODE_ENV === 'development';
  env.production = process.env.NODE_ENV === 'production';

  const { entry, htmlWebpackPlugins } = initEntry(env);
  return {
    entry,
    output: {
      filename: '[name]/bundle.js',
      path: path.resolve(__dirname, 'dist'),
      pathinfo: false,
    },
    devtool: env.development ? 'eval-cheap-module-source-map' : 'source-map',
    devServer: {
      contentBase: './dist',
      compress: true,
      hot: true,
      port
    },
    plugins: [
      new CleanWebpackPlugin(),
      ...htmlWebpackPlugins,
      new ProgressPlugin((percentage, message, ...args) => {
        if (percentage === 1) {
          if (env.production) {
            return
          }
          setTimeout(() => {
            console.log('=======================================================================================');
            console.log(`   启动成功`);
            for (let page of Object.keys(entry)) {
              console.log(`   http://127.0.0.1:${port}/${page}`);
            }
            console.log('=======================================================================================');
          }, 0)
        }
      }),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }),
      new VueLoaderPlugin(),

    ],
    module: {
      rules: [
        {
          test: /\.less$/,
          include: path.resolve(__dirname, 'src'),
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  strictMath: true,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          include: path.resolve(__dirname, 'src'),
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.vue$/,
          include: path.resolve(__dirname, 'src'),
          use: [
            'vue-loader'
          ]
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: [
            'file-loader'
          ]
        },
        {
          test: /\.m?(js)|(jsx)$/,
          exclude: /(node_modules|bower_components)/,
          include: path.resolve(__dirname, 'src'),
          use: {
            loader: 'babel-loader',
            options: babelOptions
          }
        },
        {
          test: /\.(svelte)$/,
          exclude: /(node_modules|bower_components)/,
          include: path.resolve(__dirname, 'src'),
          use: 'svelte-loader'
        }
      ]
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js' // 用 webpack 1 时需用 'vue/dist/vue.common.js'
      }
    }
  }
};