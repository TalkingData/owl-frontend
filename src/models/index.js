
/**
 * Created by guojunbing on 2017/04/05,使用两个axios实例,有products和无products。
 */
import apischema from 'apischema';
import axios from 'axios';
// import Cookies from 'js-cookie';
import { Message } from 'iview';
import router from '../router/index';

const serviceInfo = { url: '', loginServer: '' };

switch (process.env.NODE_ENV) {
  case 'production':
    // eslint-disable-next-line
    serviceInfo.url = `${CONFIG.proUrl}/api/v1`;
    // eslint-disable-next-line
    serviceInfo.loginServer =  CONFIG.proUrl;
    break;
  case 'development':
    // eslint-disable-next-line
    serviceInfo.url = `${CONFIG.devUrl}/api/v1`;
    // eslint-disable-next-line
    serviceInfo.loginServer = CONFIG.devUrl;
    break;
  default:
    // eslint-disable-next-line
    serviceInfo.url = `${CONFIG.devUrl}/api/v1`;
    // eslint-disable-next-line
    serviceInfo.loginServer =  CONFIG.devUrl;
    break;
}
const http = axios.create({
  baseURL: serviceInfo.url,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  // 2.登录以后,对token过期进行校验,以及token权限进行校验
  validateStatus(status) {
    if (status === 403) {
      Message.warning({
        content: '您没有权限，请联系管理员',
        duration: 5,
        top: 66,
        closable: true,
      });
    }
    return status;
  },
});

// 1.添加请求拦截器,初次进入页面没有tokcn的情况,前往talking页面登录
// http.interceptors.request.use((config) => {
//   const obj = config;
//   // obj.headers.Authorization = Cookies.get('token');
//   return obj;
// }, error => Promise.reject(error));

// 添加响应拦截器
http.interceptors.response.use((response) => {
  if (response.status === 200) {
    if (response.data.code === 401) {
      if (response.data.link) {
        Message.warning('认证失败，请先登录!');
        window.location.href = response.data.link;
      } else {
        router.push({
          path: '/index/timeout',
        });
      }
    }
  } else if (response.data.code === 401) {
    //  token过期,前往talking进行登录
    if (response.data.link) {
      Message.warning('认证失败，请先登录!');
      window.location.href = response.data.link;
    } else {
      router.push({
        path: '/index/timeout',
      });
    }
  }
  return response;
}, error => Promise.reject(error),
);

const schema = apischema({ http });
// export default apischema({ http });

export { serviceInfo, schema };
