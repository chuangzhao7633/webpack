const os = require('os');
const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// webpack 内置插件 生产环境自动压缩 js 代码依靠这个插件
const TerserWebpackPlugin = require('terser-webpack-plugin');
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

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
    // contenthash 当文件内容发生改变时才生成新的 hash 值
    filename: 'static/js/[name].[contenthash:8].js',
    // 打包输出的其他文件命名
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    // 通过 type: asset 方式处理的资源统一用这种命名方式
    assetModuleFilename: 'static/media/[name][hash:8][ext][query]',
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
            /* generator: {
              filename: 'static/images/[name][hash:8][ext][query]'
            } */
          },
          {
            test: /\.(ttf|woff2?|mp3|mp4|avi)$/,
            type: 'asset/resource',
            /* generator: {
              filename: 'static/media/[name][hash:8][ext][query]'
            } */
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
                  cacheCompression: false, // 关闭缓存文件压缩 压缩会影响构建速度
                  /* 
                    babel 会对每个编译文件添加辅助代码，每个文件都会重复定义，增加了代码体积
                    @babel/plugin-transform-runtime 内置了这些辅助代码，编译的文件引入即可，不会重复定义，减少了代码体积
                  */
                  plugins: ['@babel/plugin-transform-runtime']
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
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css'
    }),
    /* new CssMinimizerPlugin(),
    new TerserWebpackPlugin({
      parallel: threads // 开启多进程和进程数量处理 Terser
    }) */
    /* 
      懒加载~：当文件需要使用时才加载~
      预加载 prefetch：会在使用之前，提前加载js文件 
      正常加载可以认为是并行加载（同一时间加载多个文件）  
      预加载 prefetch：等其他资源加载完毕，浏览器空闲了，再偷偷加载资源
      preload 优先加载 
      prefetch 空闲时加载(优先级低 会产生缓存 当动态导入模块时会用缓存，加载速度更快)
      webpack4 使用预加载时在动态导入模块时使用 webpackPrefetch: true 开启
    */
    new PreloadWebpackPlugin({
      /* rel: 'preload',
      as: 'script', */
      rel: 'prefetch'
    }),
    // PWA 离线状态下也可访问
    new WorkboxPlugin.GenerateSW({
      /* 
        这些选项帮助快速启用 Serviceworks
        不允许遗留任何旧的 Serviceworks
      */
      clientsClaim: true,
      skipWaiting: true
    })
  ],

  // webpack5 推荐压缩的插件放在这
  optimization: {
    minimizer: [
      /* 
        该插件使用 nanocss 压缩和优化 css
        webpack4 中使用 optimize-css-assets-webpack-plugin 插件压缩代码
        css-minimizer-webpack-plugin 在 source maps 和 assets 中使用查询字符串会更加准确，支持缓存和并发模式下运行
      */
      new CssMinimizerPlugin(),
      // 压缩 js
      new TerserWebpackPlugin({
        parallel: threads // 开启多进程和进程数量处理 Terser
      })
    ],
    // 代码分割操作
    splitChunks: {
      // 都用默认值即可
      chunks: 'all'
    },
    /* 
      当文件中引入其他模块时，引入的模块发生改变时，该模块也会生成新的 hash 值
        缺点: 多个模块引入该模块，该模块发生改变，那么引入这个模块的其他模块的 hash 都会发生改变，这样这些文件的浏览器缓存都会失效
        解决办法: 生成一个 runtime 文件来保存各文件引入模块的 hash 值关系，这样当某一模块发送改变时，
                    就只有发生变化的模块和 runtime 文件 hash 会被修改，其他的文件不会生成新的 hash，则浏览器缓存不会失效
    */
    runtimeChunk: {
      name: enterpoint => `runtime-${enterpoint.name}.js`
    }
  },

  /* 
    生产环境开启: 默认开启 html 和 js 压缩，所以只需要单独配置 css 压缩
    生产环境下自动开启 treeshaking 通过 es6 方式引入的模块，构建打包时只引入用到的函数、对象 减少代码体积
  */
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