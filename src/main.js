import count from "./js/count";
import sum from "./js/sum";
import './css/index.css';
import './less/index.less';
import './css/iconfont.css';

console.log(count(1, 2));
console.log(sum(1, 2, 3, 4));

if (module.hot) {
  // 判断是否支持模块热替换功能
  module.hot.accept('./js/count');
  module.hot.accept('./js/sum');
}