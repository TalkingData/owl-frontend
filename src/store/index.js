import Vue from 'vue';
import Vuex from 'vuex';
import mutations from './mutations';
import actions from './action';
import getters from './getter';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    vuexAllPeoples: [],
    vuexAllGroups: [],
    allCzData: {},
    manageMask: '',   // 弹出窗类型
    searchGroupKey: '',   // 弹出窗类型
    productList: [], // 产品线列表
  },
  getters,
  actions,
  mutations,
});
