import Sql from './components/Sql.vue';
import ginFs from '@aubrgin/gin-fs';
import fs from 'fs';
import Vue from 'vue';

new Vue({
  render: (h) => h(Sql),
}).$mount('#app');

function injectCss(css) {
  var linkElement = document.createElement('link');
  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('type', 'text/css');
  linkElement.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(css));
  document.getElementsByTagName('head')[0].appendChild(linkElement);
}

injectCss(fs.readFileSync(`${ginFs.ginPath}/${ginFs.getConfig('theme', 'gin')}`));


export default Sql;
