import Vue from 'vue';
import Router from 'vue-router';
import Cookies from 'js-cookie';
import md5 from 'md5';
import Main from './main';
import Admin from './admin';
import { menu, adminMenu, otherRouter } from './config';

// 设置子路由
menu.forEach((m) => {
  // eslint-disable-next-line
  m.component = Main;
});
// 管理员页面
adminMenu.forEach((am) => {
  // eslint-disable-next-line
  am.component = Admin;
});

Vue.use(Router);

const router = new Router({
  routes: [...otherRouter, ...menu, ...adminMenu],
});
// 权限判断
const roleStr = md5(1);
router.beforeEach((to, from, next) => {
  const role = Cookies.get('owl_role');
  if (to.path.indexOf('admin') > -1) {
    if (role === roleStr) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
export default router;
