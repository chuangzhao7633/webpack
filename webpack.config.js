// nodejs 核心模块，专门用来处理路径问题
const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 入口
  entry: './src/main.js', // 相对路径

  // 输出
  output: {
    /* 
      文件输出路径 (所有文件)
        __dirname nodejs 变量，代表当前文件的文件夹目录
    */
    path: path.resolve(__dirname, 'dist'), // 绝对路径 (其他资源打包输出目录)
    // 文件名 (入口文件打包输出文件名)
    filename: 'static/js/main.js',
    /* 
      自动清空上次打包的内容
      原理: 在打包前，将 path: path.resolve(__dirname, 'dist') 整个目录清空，再进行打包
      webpack4 的时候需要插件 webpack5简化了
    */
    clean: true
  },

  // 加载器
  module: {
    rules: [
      // loader 配置
      {
        test: /\.css$/, // 只检测 css 文件
        use: [
          // 执行顺序: 从右到左
          'style-loader',// 将 js 中 css 通过创建 style 标签添加到 html 文件中生效
          'css-loader' // 将 css 资源编译成 commonjs 的模块到 js 中
        ]
      },
      {
        test: /\.less$/,
        /* loader: 'less-loader', */
        use: [
          'style-loader',
          'css-loader',
          'less-loader' // 将 less 文件转换为 css
        ]
      }, 
      {
        /* 
          图片资源的处理: webpack5 之前需要 url-loader file-loader
            webpack5 后直接内置到 webpack 中
        */
        test: /\.(png|jpe?g|gif|webp|svg)$/,
        type: 'asset',
        parser: { // 解析资源
          dataUrlCondition: {
            /* 
              小于 10kb 的图片转为 dataUrlCondition(base64)
                优点: 减少请求数量
                缺点: 体积增大
            */
            maxSize: 10 * 1024
          }
        },
        generator: {
          // 输出图片名称
          filename: 'static/images/[name][hash:8][ext][query]'
        }
      },
      {
        // 其他资源处理
        test: /\.(ttf|woff2?|mp3|mp4|avi)$/,
        type: 'asset/resource',
        generator: {
          // 输出图片名称
          filename: 'static/media/[name][hash:8][ext][query]'
        }
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/, // 排除 node_modules 中的 js 文件
        loader: 'babel-loader',
        /* options: {
          presets: [
            '@babel/preset-env', // 智能预设 可以解析 es6 语法
            '@babel/preset-react',
            '@babel/preset-typescript'
          ]
        } */
      }
    ]
  },

  // 插件
  plugins: [
    // plugin 配置
    /* 
      webpack4 中 eslint 通过 loader 使用
      webpack5 中 eslint 通过 plugin 使用
    */
    new EslintPlugin({
      // 检测那些文件
      context: path.resolve(__dirname, 'src')
    }),
    new HtmlWebpackPlugin({
      /* 
        模板: 以 public/index.html 文件为模板创建新的 html 文件
        新的 html 文件的特点: 1. 结构和原来一致 2. 自动引入打包输出的资源
      */
      template: path.resolve(__dirname, 'public/index.html')
    })
  ],

  // 开发服务器
  devServer: {
    host: 'localhost', // 域名
    port: '3000', // 端口号
    open: true // 自动打开浏览器
  },

  // 模式
  mode: 'development'
}