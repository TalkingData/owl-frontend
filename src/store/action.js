import { getCzLog, getProducts } from '../models/service';

export default {
  // manage获取操作日志
  getCzData({ commit, state }, data) {
    if (data === undefined) {
      data = {
        page: 1,
        pageSize: 10,
      };
    }
    getCzLog(data).then((response) => {
      if (response.status === 200) {
        commit('setCzLog', response.data);
      }
    });
  },
  // 获取产品线列表
  getProducts({ commit, state }) {
    getProducts().then((res) => {
      if (res.status === 200 && res.data.code === 200) {
        commit('setProducts', res.data.products);
      }
    });
  },
};
