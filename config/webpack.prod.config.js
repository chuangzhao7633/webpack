const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ]
  },

  plugins: [
    new EslintPlugin({
      context: path.resolve(__dirname, '../src')
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
    new CssMinimizerPlugin()
  ],

  // 生产环境开启: 默认开启 html 和 js 压缩，所以只需要单独配置 css 压缩
  mode: 'production'
}