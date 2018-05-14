import Cookies from 'js-cookie';
import layout from '@/components/layout-basic';
import logo from '../assets/logo.jpg';
import logoMini from '../assets/logo-min.jpg';

// 其他路由
const otherRouter = [
  {
    path: '/',
    name: 'firstPage',
    redirect() {
      // 方法接收 目标路由 作为参数
      // return 重定向的 字符串路径/路径对象
      if (Cookies.get('owl_role')) {
        return '/product';
      }
      return '/login';
    },
  },
  {
    path: '/login',
    name: 'login',
    // eslint-disable-next-line
    component: (resolve) => require(['../views/login/login.vue'], resolve),
  },
  {
    path: '/index',
    name: 'login-index',
    // eslint-disable-next-line
    component: (resolve) => require(['../views/login/login-index.vue'], resolve),
  },
  {
    path: '/product',
    name: 'product',
    // eslint-disable-next-line
    component: (resolve) => require(['../views/login/product.vue'], resolve),
  },
];
// main下路由结构, isSubPage: false展示在导航栏;true时不展示在导航栏,作为二级页面使用
// parentPage,当该路由是二级页面时,需要配置其父级页面name,用做导航栏选中状态
// 第一级path作为展示使用,name必须唯一,决定那一个menu展开
// children中name用做menu中name选项,决定是哪一个submenu处于选中状态,必须唯一
const menu = [
  {
    path: '/console',
    icon: 'speedometer',
    name: 'console',
    title: '主控台',
    // component: Layout,
    children: [
      {
        path: 'panel/list/:productId',
        title: '看板列表',
        name: 'panel_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/console/panel-list.vue'], resolve),
      },
      {
        path: 'panel/detail/:panelId/:productId',
        title: '看板详情',
        name: 'panel_detail',
        isSubPage: true,
        parentPage: 'panel_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/console/panel-detail.vue'], resolve),
      },
      {
        path: 'metric/list/:productId',
        title: '指标列表',
        name: 'metric_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/metric/metric-list.vue'], resolve),
      },
      {
        path: 'metric/dashboard/:productId',
        title: '指标预览',
        name: 'metric_dashboard',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/metric/metric-dashboard.vue'], resolve),
      },
    ],
  },
  {
    path: '/monitor',
    icon: 'ios-list',
    name: 'monitor',
    title: '主机管理',
    // component: Layout,
    children: [
      {
        path: 'monitorhost/:productId',
        title: '主机列表',
        name: 'monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/monitor-host.vue'], resolve),
      },
      {
        path: 'hostdetail/:hostId/:productId',
        title: '主机详情',
        name: 'hostdetail',
        isSubPage: true,
        parentPage: 'monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-detail.vue'], resolve),
      },
      {
        path: 'host/plugin/:hostId/:productId',
        title: '查看插件',
        name: 'hostpluginofhost',
        isSubPage: true,
        parentPage: 'monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-plugin.vue'], resolve),
      },
      {
        path: 'monitorgroup/:productId',
        title: '主机组列表',
        name: 'monitor_group',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/monitor-group.vue'], resolve),
      },
      {
        path: 'groupdetail/:groupId/:productId',
        title: '主机组详情',
        name: 'groupdetail',
        isSubPage: true,
        parentPage: 'monitor_group',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/group-detail.vue'], resolve),
      },
      {
        path: 'grouphost/:hostId/:groupId/:productId',
        title: '主机详情',
        name: 'hostdetailofgroup',
        isSubPage: true,
        parentPage: 'monitor_group',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-detail.vue'], resolve),
      },
      {
        path: 'group/plugin/:hostId/:groupId/:productId',
        title: '查看插件',
        name: 'hostpluginofgroup',
        isSubPage: true,
        parentPage: 'monitor_group',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-plugin.vue'], resolve),
      },
    ],
  },
  {
    path: '/alarm',
    icon: 'ios-bell',
    name: 'alarm',
    title: '报警管理',
    children: [
      {
        path: 'strategylist/:productId',
        title: '策略列表',
        name: 'strategylist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/alarm-strategy-list.vue'], resolve),
      },
      {
        path: 'brule/:productId',
        title: '创建策略',
        name: 'brule',
        isSubPage: true,
        parentPage: 'strategylist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/build-strategy.vue'], resolve),
      },
      {
        path: 'vrule/:strategyId/:productId',
        title: '查看策略',
        name: 'vrule',
        isSubPage: true,
        parentPage: 'strategylist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/build-strategy.vue'], resolve),
      },
      {
        path: 'crule/:strategyId/:productId',
        title: '克隆策略',
        name: 'crule',
        isSubPage: true,
        parentPage: 'strategylist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/build-strategy.vue'], resolve),
      },
      {
        path: 'erule/:strategyId/:productId',
        title: '编辑策略',
        name: 'erule',
        isSubPage: true,
        parentPage: 'strategylist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/build-strategy.vue'], resolve),
      },
      {
        path: 'eventlist/:productId',
        title: '报警事件',
        name: 'eventlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/alarm-event-list.vue'], resolve),
      },
      {
        path: 'eventlistby/:strategyId/:status/:productId',
        title: '报警事件',
        name: 'eventlistBy',
        isSubPage: true,
        parentPage: 'eventlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/alarm-event-list.vue'], resolve),
      },
      {
        path: 'event/:eventId/:productId',
        title: '告警详情',
        name: 'eventDetail',
        isSubPage: true,
        parentPage: 'eventlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/alarm/event-detail.vue'], resolve),
      },
    ],
  },
  {
    path: '/manage',
    icon: 'person-stalker',
    name: 'manage',
    title: '用户管理',
    children: [
      {
        path: 'userlist/:productId',
        title: '用户列表',
        name: 'userlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/manage/manage-user-list.vue'], resolve),
      },
      {
        path: 'usergroup/:productId',
        title: '用户组列表',
        name: 'usergroup',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/manage/user-group-list.vue'], resolve),
      },
      {
        path: 'usergroupdetail/:usergroupId/:productId',
        title: '用户组详情',
        name: 'usergroupdetail',
        isSubPage: true,
        parentPage: 'usergroup',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/manage/user-group-detail.vue'], resolve),
      },
    ],
  },
];

const adminMenu = [
  {
    path: '/admin/product',
    icon: 'android-apps',
    name: 'adminproduct',
    title: '产品线',
    children: [
      {
        path: 'list',
        title: '产品线列表',
        name: 'admin_productlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-product/admin-product.vue'], resolve),
      },
      {
        path: 'detail/:productId',
        title: '产品线详情',
        name: 'admin_productdetail',
        isSubPage: true,
        parentPage: 'admin_productlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-product/product-detail.vue'], resolve),
      },
      {
        path: 'hostdetail/:hostId/:productId',
        title: '主机详情',
        name: 'pro_hostdetail',
        isSubPage: true,
        parentPage: 'admin_productlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-detail.vue'], resolve),
      },
      {
        path: 'host/plugin/:hostId/:productId',
        title: '查看插件',
        name: 'hostpluginofproduct',
        isSubPage: true,
        parentPage: 'admin_productlist',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-plugin.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/monitor',
    icon: 'ios-list',
    name: 'adminmonitor',
    title: '主机管理',
    children: [
      {
        path: 'hostlist',
        title: '主机列表',
        name: 'admin_monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-monitor/product-host.vue'], resolve),
      },
      {
        path: 'hostdetail/:hostId',
        title: '主机详情',
        name: 'admin_monitor_hostdetail',
        isSubPage: true,
        parentPage: 'admin_monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-detail.vue'], resolve),
      },
      {
        path: 'host/plugin/:hostId',
        title: '查看插件',
        name: 'hostpluginofadmin',
        isSubPage: true,
        parentPage: 'admin_monitor_host',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/monitor/host-plugin.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/plugin',
    icon: 'ios-pricetag',
    name: 'adminplugin',
    title: '插件管理',
    children: [
      {
        path: 'pluginlist',
        title: '插件列表',
        name: 'admin_plugin_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-plugin/admin-plugin-list.vue'], resolve),
      },
      {
        path: 'plugindetail/:pluginId',
        title: '插件详情',
        name: 'admin_plugin_detail',
        isSubPage: true,
        parentPage: 'admin_plugin_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-plugin/plugin-detail.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/script',
    icon: 'code-working',
    name: 'adminscript',
    title: '告警介质',
    children: [
      {
        path: 'scriptlist',
        title: '脚本列表',
        name: 'admin_script_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-script/admin-script-list.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/template',
    icon: 'social-buffer',
    name: 'admintemplate',
    title: '告警模板',
    children: [
      {
        path: 'list',
        title: '模板列表',
        name: 'admin_template',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-template/template-list.vue'], resolve),
      },
      {
        path: 'create',
        title: '创建模板',
        name: 'admin_template_create',
        isSubPage: true,
        parentPage: 'admin_template',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-template/create-template.vue'], resolve),
      },
      {
        path: 'detail/:templateId',
        title: '模板详情',
        name: 'admin_template_detail',
        isSubPage: true,
        parentPage: 'admin_template',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-template/create-template.vue'], resolve),
      },
      {
        path: 'edit/:templateId',
        title: '编辑模板',
        name: 'admin_template_edit',
        isSubPage: true,
        parentPage: 'admin_template',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-template/create-template.vue'], resolve),
      },
      {
        path: 'clone/:templateId',
        title: '克隆模板',
        name: 'admin_template_clone',
        isSubPage: true,
        parentPage: 'admin_template',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-template/create-template.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/cluster',
    icon: 'help-buoy',
    name: 'admincluster',
    title: '告警队列',
    children: [
      {
        path: 'detail',
        title: '告警队列',
        name: 'admin_cluster',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-cluster/cluster.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/manage',
    icon: 'person-stalker',
    name: 'adminmanage',
    title: '用户管理',
    children: [
      {
        path: 'userlist',
        title: '用户列表',
        name: 'admin_user_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-manage/admin-user-list.vue'], resolve),
      },
    ],
  },
  {
    path: '/admin/log',
    icon: 'ios-book',
    name: 'adminloglist',
    title: '日志管理',
    children: [
      {
        path: 'loglist',
        title: '日志列表',
        name: 'admin_log_list',
        // eslint-disable-next-line
        component: (resolve) => require(['../views/admin-log/admin-log.vue'], resolve),
      },
    ],
  },
];

export { layout, menu, adminMenu, logo, logoMini, otherRouter };
