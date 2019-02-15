import { schema } from './index';
// 获取用户信息
export const getUserInfo = schema.get('/users/profile', {});
// 更新用户
export const updateUser = schema.put('/users/profile', {});
export const postLogin = schema.post('/login', {});
export const postLogout = schema.post('/logout', {});

export const changePassword = schema.post('/users/changepassword', {});
// 返回当前用户所在的产品线列表
export const getProducts = schema.get('/users/products', {});
export const getAllProducts = schema.get('/products', {});
export const addProduct = schema.post('/products', {});
export const updatetProduct = schema.put('/products');
export const deleteProduct = schema.delete('/products/{productId}', {
  productId: { type: Number, required: true, urlOnly: true },
});

// console----------------------------------------
export const closeFavor = schema.post('/panels/{favorId}/unfavor', {
  favorId: { type: Number, required: true, urlOnly: true },
});
// 增加panel到常用看板
export const addPanelToFavor = schema.post('/panels/{panelId}/favor', {
  panelId: { type: Number, required: true, urlOnly: true },
});

// 获取看板列表
export const getPanels = schema.get('/products/{productId}/panels', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 新建看板
export const addPanels = schema.post('/products/{productId}/panels', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 修改看板
export const updatePanels = schema.put('/products/{productId}/panels', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 删除看板
export const deletePanels = schema.delete('/products/{productId}/panels/{panelId}', {
  productId: { type: Number, required: true, urlOnly: true },
  panelId: { type: Number, required: true, urlOnly: true },
});
// 获取看板下图表信息
export const getPanelCharts = schema.get('/products/{productId}/panels/{panelId}/charts', {
  productId: { type: Number, required: true, urlOnly: true },
  panelId: { type: Number, required: true, urlOnly: true },
});
// 查询图表详情数据
export const getQueryChart = schema.get('/query', {});
// 新建图表
export const addCharts = schema.post('/products/{productId}/panels/{panelId}/charts', {
  productId: { type: Number, required: true, urlOnly: true },
  panelId: { type: Number, required: true, urlOnly: true },
});
// 获取该id下chart的相关信息
export const getChartInfo = schema.get('/charts/{chartId}', {
  chartId: { type: Number, required: true, urlOnly: true },
});
// 更新图表
export const updateCharts = schema.put('/products/{productId}/panels/{panelId}/charts', {
  productId: { type: Number, required: true, urlOnly: true },
  panelId: { type: Number, required: true, urlOnly: true },
});
// 删除图表
export const deleteCharts =
schema.delete('/products/{productId}/panels/{panelId}/charts/{chartId}', {
  productId: { type: Number, required: true, urlOnly: true },
  panelId: { type: Number, required: true, urlOnly: true },
  chartId: { type: Number, required: true, urlOnly: true },
});

// 获取metric products/1/metrics
export const getSuggestMetric = schema.get('/suggest/metrics', {});
export const getSuggestTags = schema.get('/suggest/tags', {});
// 获取已有tags key
export const getSuggestKey = schema.get('/suggest/tagk', {});
// 获取已有tags value
export const getSuggestValue = schema.get('/suggest/tagv', {});

// 获取设备状态
export const getHostStatus = schema.get('/statistics/host/status');
// 获取报警分布
export const getEventCount = schema.get('/statistics/event/count', {});
// 获取报警状态
export const getEvevtStatus = schema.get('/statistics/event/status', {});
// 获取报警趋势分布
export const getEvevtPanel = schema.get('/statistics/event/panel', {});
// 获取所有图表
export const getAllCharts = schema.get('/charts', {});
// console=========================================

// manage------------------------------------------
// 获取所有用户
export const getAllUsers = schema.get('/users', {});
export const changeUserRole = schema.put('/users/change_role', {});
export const addUsers = schema.post('/users', {});
export const deleteUsers = schema.delete('/users/{userId}', {
  userId: { type: Number, required: true, urlOnly: true },
});
// 重置为默认密码
export const resetDefaultUser = schema.post('/users/resetpassword', {});
// 获取产品线下所有人员
export const getUserOfPro = schema.get('/products/{productId}/users', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取用户组
export const getUserGroups = schema.get('/products/{productId}/user_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取用户组中的用户
export const getUserOfGroup = schema.get('/products/{productId}/user_groups/{groupId}/users', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取不在用户组中的用户
export const getUserOutGroup = schema.get('/products/{productId}/user_groups/{groupId}/users/not_in', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 向用户组添加用户
export const addUserInGroup = schema.put('/products/{productId}/user_groups/{groupId}/users/add', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 向用户组删除用户
export const removeUserInGroup = schema.put('/products/{productId}/user_groups/{groupId}/users/remove', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取不在产品线下的用户
export const getUserOutPro = schema.get('/products/{productId}/users/not_in', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 向产品线添加用户
export const addUserInPro = schema.put('/products/{productId}/users/add', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 向产品线删除用户
export const removeUserInPro = schema.put('/products/{productId}/users/remove', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 修改用户组,修改组名和描述信息
export const updateUserGroup = schema.put('/products/{productId}/user_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 新增人员组
export const addUserGroups = schema.post('/products/{productId}/user_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 删除人员设置组信息 /products/{product_id}/user_groups/{user_group_id}
export const deleteUserGroup = schema.delete('/products/{productId}/user_groups/{groupId}', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取操作日志
export const getCzLog = schema.get('/products/{productId}/operations', {
  productId: { type: Number, required: true, urlOnly: true },
});

// monitor----------------------------------------------
// 获取所有主机组
export const getHostGroups = schema.get('/products/{productId}/host_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取所有主机列表,不区分产品线
export const getAllHosts = schema.get('/hosts', {});
// 删除主机
export const deleteHost = schema.delete('/hosts/{hostId}', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 静音接口/api/v1/hosts/host_id/mute?mute_time=xxxx-xx-xx xx:xx:xx
export const muteHost = schema.put('/hosts/{hostId}/mute?mute_time={muteTime}', {
  hostId: { type: String, required: true, urlOnly: true },
  muteTime: { type: String, required: true, urlOnly: true },
});
// 取消静音： /api/v1/hosts/host_id/unmute
export const unmuteHost = schema.put('/hosts/{hostId}/unmute', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 创建主机组
export const addHostGroups = schema.post('/products/{productId}/host_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 修改用户组,修改组名和描述信息
export const updateHostGroup = schema.put('/products/{productId}/host_groups', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取某主机组下已包含主机
export const getHostOfGroup = schema.get('/products/{productId}/host_groups/{groupId}/hosts', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取某主机组下已包含插件
export const getPluginOfGroup = schema.get('/products/{productId}/host_groups/{groupId}/plugins', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 向主机组中添加插件
export const addPluginInGroup = schema.post('/products/{productId}/host_groups/{groupId}/plugins', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
export const deletePluginOfGroup = schema.delete('/products/{productId}/host_groups/{groupId}/plugins/{pluginId}', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
  pluginId: { type: Number, required: true, urlOnly: true },
});
export const updatePluginInGroup = schema.put('/products/{productId}/host_groups/{groupId}/plugins', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取不在主机组中的主机
export const getHostOutGroup = schema.get('/products/{productId}/host_groups/{groupId}/hosts/not_in', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 向主机组添加主机
export const addHostInGroup = schema.put('/products/{productId}/host_groups/{groupId}/hosts/add', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取主机组策略列表
export const getStrategyInGroup = schema.get('/products/{productId}/strategies/list/{groupId}', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 向主机组删除主机
export const removeHostInGroup = schema.put('/products/{productId}/host_groups/{groupId}/hosts/remove', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 删除主机组,未开放接口
export const delHostGroup = schema.delete('/products/{productId}/host_groups/{groupId}', {
  productId: { type: Number, required: true, urlOnly: true },
  groupId: { type: Number, required: true, urlOnly: true },
});
// 获取产品下所有主机
export const getHostOfPro = schema.get('/products/{productId}/hosts', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取产品线之外的主机
export const getHostOutPro = schema.get('/products/{productId}/hosts/not_in', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 向主产品线添加主机
export const addHostInPro = schema.put('/products/{productId}/hosts/add', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 向主产品线删除主机
export const removeHostInPro = schema.put('/products/{productId}/hosts/remove', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取主机状态summary old
export const getStatusSummary = schema.get('/products/{productId}/statistics/host/status', {
  productId: { type: Number, required: true, urlOnly: true },
});
export const getHostDetail = schema.get('/hosts/{hostId}', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 获取主机下所有metric
export const getMetricByHost = schema.get('/hosts/{hostId}/metrics', {
  hostId: { type: String, required: true, urlOnly: true },
});
export const deleteHostMetric = schema.delete('/hosts/{hostId}/metrics/{metricId}', {
  hostId: { type: String, required: true, urlOnly: true },
  metricId: { type: Number, required: true, urlOnly: true },
});
// 获取主机下的apps
export const getAppByHost = schema.get('/hosts/{hostId}/apps', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 获取主机下插件
export const getPluginOfHost = schema.get('/hosts/{hostId}/plugins', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 添加主机下插件
export const addPluginOfHost = schema.post('/hosts/{hostId}/plugins', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 修改主机下插件
export const updatePluginOfHost = schema.put('/hosts/{hostId}/plugins', {
  hostId: { type: String, required: true, urlOnly: true },
});
// 删除主机下插件
export const deletePluginOfHost = schema.delete('/hosts/{hostId}/plugins/{pluginId}', {
  hostId: { type: String, required: true, urlOnly: true },
  pluginId: { type: Number, required: true, urlOnly: true },
});
// 获取主机信息根据plugins old
export const getHostByPlugins = schema.get('/products/{productId}/hosts/{id}/plugins', {
  productId: { type: Number, required: true, urlOnly: true },
  id: { type: Number, required: true, urlOnly: true },
});
// 获取主机信息根据strategies
export const getHostByStrategies = schema.get('/products/{productId}/hosts/{id}/strategies', {
  productId: { type: Number, required: true, urlOnly: true },
  id: { type: Number, required: true, urlOnly: true },
});
// monitor====================End=====================
// plugin------------------------------------------
export const editPlugin = schema.put('/plugins', {});
export const getAllPlugins = schema.get('/plugins', {});
export const createPlugin = schema.post('/plugins', {});
export const deletePlugin = schema.delete('/plugins/{pluginId}', {
  pluginId: { type: Number, required: true, urlOnly: true },
});
// 获取插件的主机组
export const getGroupsInPlugin = schema.get('/plugins/{pluginId}/host_groups', {
  pluginId: { type: Number, required: true, urlOnly: true },
});
// 获取插件外的主机组
export const getGroupsOutPlugin = schema.get('/plugins/{pluginId}/host_groups/not_in', {
  pluginId: { type: Number, required: true, urlOnly: true },
});
// 添加主机组到插件
export const addGroupsInPlugin = schema.put('/plugins/{pluginId}/host_groups/add', {
  pluginId: { type: Number, required: true, urlOnly: true },
});
// 移除主机组到中的插件
export const removeGroupInPlugin = schema.put('/plugins/{pluginId}/host_groups/remove', {
  pluginId: { type: Number, required: true, urlOnly: true },
});
// alarm-------------------------------------------------
// 获取告警列表products/:product_id/events
export const getEvents = schema.get('/products/{productId}/events', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取告警详情,某个报警事件的报警历史
export const getEventInfo = schema.get('/products/{productId}/events/detail/{id}', {
  productId: { type: Number, required: true, urlOnly: true },
  id: { type: Number, required: true, urlOnly: true },
});
// 获取告警下的历史记录,获取某个报警事件的历史处理记录
export const getEventRecods = schema.get('/products/{productId}/events/process/{id}', {
  productId: { type: Number, required: true, urlOnly: true },
  id: { type: Number, required: true, urlOnly: true },
});
// 报警知悉
export const awareEvent = schema.put('/products/{productId}/events/aware{param}', {
  productId: { type: Number, required: true, urlOnly: true },
  param: { type: String, required: true, urlOnly: true },
});
// 获取有问题的报警事件列表,用于规则列表页查看告警情况
export const getEventsFailed = schema.get('/products/{productId}/events/failed', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取规则列表
export const getStrategies = schema.get('/products/{productId}/strategies', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 获取规则详情id: { type: Number, required: true, urlOnly: true },
export const getStrategyInfo = schema.get('/products/{productId}/strategies/info/{id}', {
  productId: { type: Number, required: true, urlOnly: true },
  id: { type: Number, required: true, urlOnly: true },
});
// 创建规则
export const addStrategie = schema.post('/products/{productId}/strategies', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 修改规则
export const updateStrategie = schema.put('/products/{productId}/strategies', {
  productId: { type: Number, required: true, urlOnly: true },
});
// 启用 or 禁用 策略
export const enableStrategie = schema.put('/products/{productId}/strategies/switch{param}', {
  productId: { type: Number, required: true, urlOnly: true },
  param: { type: String, required: true, urlOnly: true },
});
// 删除策略
export const deleteStrategie = schema.delete('/products/{productId}/strategies{param}', {
  productId: { type: Number, required: true, urlOnly: true },
  param: { type: String, required: true, urlOnly: true },
});
// 获取脚本列表
export const getScripts = schema.get('/scripts', {});
export const addScript = schema.post('/scripts', {});
export const removeScript = schema.delete('/scripts{param}', {
  param: { type: String, required: true, urlOnly: true },
});
export const updateScript = schema.put('/scripts', {});
// 获取模板列表
export const getTemplates = schema.get('/templates', {});
export const getTemplateInfo = schema.get('/templates/{templateId}', {
  templateId: { type: Number, required: true, urlOnly: true },
});
export const addTemplate = schema.post('/templates', {});
export const updateTemplate = schema.put('/templates', {});
export const deleteTemplate = schema.delete('/templates{param}', {
  param: { type: String, required: true, urlOnly: true },
});

// 获取操作日志列表
export const getOperateLog = schema.get('/operations', {});
// 集群队列,报警队列
export const getQuequeStatus = schema.get('/health/queues/status', {});
// 操作队列
export const updateQueue = schema.post('/health/queues/{id}/{action}', {
  id: { type: Number, required: true, urlOnly: true },
  action: { type: String, required: true, urlOnly: true },
});

// 监控节点
export const getNodeStatus = schema.get('/health/nodes/status');
