import {
  setPeoples,
  setGroups,
  closeManageMask,
  setCzLog,
  setProducts,
} from './mutations-type';

export default {
// 修改state中人员的信息
  [setPeoples](state, val) {
    state.vuexAllPeoples = val;
  },
// 修改state中组的信息
  [setGroups](state, val) {
    state.vuexAllGroups = val;
  },
// 修改state中操作日志
  [setCzLog](state, val) {
    state.allCzData = val;
  },
// 关闭弹出窗
  [closeManageMask](state) {
    state.manageMask = 'close';
  },
  // 获取产品线列表
  [setProducts](state, val) {
    state.productList = val;
  },
};
