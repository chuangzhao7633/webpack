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