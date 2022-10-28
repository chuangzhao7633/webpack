const os = require('os');
const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// webpack 内置插件 生产环境自动压缩 js 代码依靠这个插件
const TerserWebpackPlugin = require('terser-webpack-plugin');

const threads = os.cpus().length; // cpu 核心数

// 获取处理样式的 loader
const getStyleLoader = () => [
  // 提取 css 成单独文件，HtmlWebpackPlugin 插件会在 html 文件中自动 link 引入样式表
  MiniCssExtractPlugin.loader,
  'css-loader',
  {
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        plugins: [
          // 解决样式兼容性问题，根据 package.json 中 browserslist 配置的规则进行编译
          'postcss-preset-env'
        ]
      }
    }
  }
];

module.exports = {
  entry: './src/main.js',

  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'static/js/main.js',
    clean: true
  },

  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.css$/,
            use: getStyleLoader()
          },
          {
            test: /\.less$/,
            use: [...getStyleLoader(), 'less-loader']
          }, 
          {
            test: /\.(png|jpe?g|gif|webp|svg)$/,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 10 * 1024
              }
            },
            generator: {
              filename: 'static/images/[name][hash:8][ext][query]'
            }
          },
          {
            test: /\.(ttf|woff2?|mp3|mp4|avi)$/,
            type: 'asset/resource',
            generator: {
              filename: 'static/media/[name][hash:8][ext][query]'
            }
          },
          {
            test: /\.(js|jsx)$/,
            // exclude: /node_modules/, // 除了 node_modules 下的文件，其他文件都处理
            include: path.resolve(__dirname, '../src'), // 只处理 src 下的文件，其他文件不处理
            use: [
              {
                loader: 'thread-loader', // 开启多进程对 babel 进行处理
                options: {
                  works: threads // 进程数量
                }
              },
              {
                loader: 'babel-loader',
                options: {
                  /* 
                    babel 缓存，第二次构建时只构建更改的 js 模块，未更改的使用之前的缓存
                      作用: 提升打包构建的速度
                  */
                  cacheDirectory: true, // 开启 babel 缓存
                  cacheCompression: false // 关闭缓存文件压缩 压缩会影响构建速度
                }
              }
            ]
          }
        ]
      }
    ]
  },

  plugins: [
    new EslintPlugin({
      context: path.resolve(__dirname, '../src'),
      exclude: 'node_modules', // 默认值
      cache: true, // 开启缓存
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
      threads // 开启多进程和进程数量处理 Eslint
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html')
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/main.css'
    }),
    /* 
      该插件使用 nanocss 压缩和优化 css
      webpack4 中使用 optimize-css-assets-webpack-plugin 插件压缩代码
      css-minimizer-webpack-plugin 在 source maps 和 assets 中使用查询字符串会更加准确，支持缓存和并发模式下运行
    */
    /* new CssMinimizerPlugin(),
    new TerserWebpackPlugin({
      parallel: threads // 开启多进程和进程数量处理 Terser
    }) */
  ],

  // webpack5 推荐压缩的插件放在这
  optimization: {
    minimizer: [
      // 压缩 css
      new CssMinimizerPlugin(),
      // 压缩 js
      new TerserWebpackPlugin({
        parallel: threads // 开启多进程和进程数量处理 Terser
      }) 
    ]
  },

  // 生产环境开启: 默认开启 html 和 js 压缩，所以只需要单独配置 css 压缩
  mode: 'production',

  /* 
    生产环境: 源代码是否隐藏 调试是否友好
      内联会让代码体积变大 所以生产环境不使用内联
      nosources-source-map 全部隐藏
      hidden-source-map 只隐藏源代码, 只能提示到构建后代码的错误位置

      综合 source-map / cheap-module-source-map
  */
  devtool: 'source-map'
}