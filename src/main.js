/* 
  babel 解析 es6 语法，但是如 promise async 以及后续的数组的 includes 等方法不会解析
  为了彻底解决 js 兼容性问题，需要使用 core-js 这个库(对这些高级语法的底层实现进行引入)

  完整引入: import 'core-js';
  按需引入: import 'core-js/es/promise';
  开发过程中自己按需引入太麻烦，在 babel 配置中可以设置自动按需引入
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage", // 按需加载 自动引入
        "corejs": "3.26.0" // corejs 版本
      }
    ]
*/
import count from "./js/count";
/* import sum from "./js/sum"; */
import './css/index.css';
import './less/index.less';
import './css/iconfont.css';

console.log(count(1, 2));

document.getElementById('btn').onclick = () =>{
  // /* webpackChunkName: 'sum' */ 动态导入模块打包会单独打包成一个文件 用这种方式命名
  import(/* webpackChunkName: 'sum', webpackPrefetch: true */'./js/sum').then(
    result => {
      console.log(result.default(1, 2, 3, 4));
    }
  ).catch(err => console.log('动态导入模块失败', err));
}

new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, 1000);
});

if (module.hot) {
  // 判断是否支持模块热替换功能
  module.hot.accept('./js/count');
  module.hot.accept('./js/sum');
}

if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
    .then(registration => console.log('SW registed', registration))
    .catch(registrationError => console.log('SW registed failed', registrationError));
  });
}