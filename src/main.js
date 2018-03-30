// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import iView from 'iview';
import 'normalize.css';
import 'iview/dist/styles/iview.css';
import App from './App';
import router from './router';
import store from './store';

Vue.use(iView);
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
  store,
});
// eslint-disable-next-line
Date.prototype.setStart = function() {
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
};
// eslint-disable-next-line
Date.prototype.setEnd = function() {
  this.setHours(23);
  this.setMinutes(59);
  this.setSeconds(59);
};
