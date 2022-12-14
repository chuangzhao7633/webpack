const os = require('os');
// nodejs 核心模块，专门用来处理路径问题
const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const threads = os.cpus().length; // cpu 核心数

module.exports = {
  // 入口
  entry: './src/main.js', // 相对路径

  // 输出
  output: {
    /* 
      文件输出路径 (所有文件)
        __dirname nodejs 变量，代表当前文件的文件夹目录
    */
    path: undefined, // 开发环境使用 devServer 不需要打包输出
    /* path: path.resolve(__dirname, 'dist'),  */// 绝对路径 (其他资源打包输出目录)
    // 文件名 (入口文件打包输出文件名)
    filename: 'static/js/[name].js',
    // 打包输出的其他文件命名
    chunkFilename: 'static/js/[name].chunk.js',
    // 通过 type: asset 方式处理的资源统一用这种命名方式
    assetModuleFilename: 'static/media/[name][hash:8][ext][query]',
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
        // 打包文件只被当中一个处理，找到后就不再往下找
        oneOf: [
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
            /* generator: {
              // 输出图片名称
              filename: 'static/images/[name][hash:8][ext][query]'
            } */
          },
          {
            // 其他资源处理
            test: /\.(ttf|woff2?|mp3|mp4|avi)$/,
            type: 'asset/resource',
            /* generator: {
              // 输出图片名称
              filename: 'static/media/[name][hash:8][ext][query]'
            } */
          },
          {
            test: /\.(js|jsx)$/,
            // exclude: /node_modules/, // 排除 node_modules 中的 js 文件
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
                  /* presets: [
                    '@babel/preset-env', // 智能预设 可以解析 es6 语法
                    '@babel/preset-react',
                    '@babel/preset-typescript'
                  ] */
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

  // 插件
  plugins: [
    // plugin 配置
    /* 
      webpack4 中 eslint 通过 loader 使用
      webpack5 中 eslint 通过 plugin 使用
    */
    new EslintPlugin({
      // 检测那些文件
      context: path.resolve(__dirname, '../src'),
      exclude: 'node_modules', // 默认值
      cache: true, // 开启缓存
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
      threads // 开启多进程和进程数量处理 Eslint
    }),
    new HtmlWebpackPlugin({
      /* 
        模板: 以 public/index.html 文件为模板创建新的 html 文件
        新的 html 文件的特点: 1. 结构和原来一致 2. 自动引入打包输出的资源
      */
      template: path.resolve(__dirname, '../public/index.html')
    })
  ],

  // 开发服务器
  devServer: {
    host: 'localhost', // 域名
    port: '3000', // 端口号
    open: true, // 自动打开浏览器
    /* 
      开启 HMR 功能: 每次打包运行只打包替换修改的模块，不用全部打包
      webpack5 默认开启 webpack4 需要手动开启
      css 中可以生效 style-loader 实现了 HMR 功能
      js 中不会生效:
        单个 js 文件可以: 
          if (module.hot) {
            // 判断是否支持模块热替换功能
            module.hot.accept('./js/count');
            module.hot.accept('./js/sum');
          }
        多个 js 文件: 使用 vue-loader 或者 react-hot-loader
    */
    hot: true
  },

  // 模式
  mode: 'development',
  
  /* 
    SourceMap:  一种提供源代码到构建后代码映射的技术 (如果构建后的代码出错了, 通过映射可以追踪源代码错误)

    [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map

    source-map: 外部
      错误代码准确信息和源代码错误位置

    inline-source-map: 内联
      只生成一个内联 -source-map
      错误代码准确信息和源代码错误位置
    
    hidden-source-map: 外部
      错误代码错误原因, 但是没有错误位置
      不能追踪源代码错误, 只能提示到构建后代码的错误位置

    eval-source-map: 内联
      每一个文件都生成对应的 source-map 都在 eval
      错误代码准确信息和源代码错误位置

    nosources-source-map: 外部
      错误代码准确信息, 但是没有任何源代码信息

    cheap-source-map: 外部
      错误代码准确信息和源代码错误位置
      只能精确到行

    cheap-module-source-map: 外部
      错误代码准确信息和源代码错误位置
      module 会将 loader 的 source-map 加入

    内联与外部区别: 1.外部生成文件 内联没有 2.内联构建速度更快

    开发环境: 速度快 调试友好
      速度快(eval > inline > cheap > ...)
        eval-cheap-source-map
        eval-source-map

      调试更友好
        source-map
        cheap-module-source-map
        cheap-source-map

      综合 eval-source-map / eval-cheap-module-source-map
  */
  devtool: 'eval-source-map'
}