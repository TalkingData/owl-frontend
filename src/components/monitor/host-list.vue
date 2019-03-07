<style lang="scss">
  @import './host-list.scss';
</style>
<template>
  <div class="common-host-list">
    <div class="table-list host-list">
      <div class="table-list-header clearfix mb-10">
        <div class="float-left">
          <Button :disabled="!disableObj.isRemove" 
          v-if="listMode === 'product' || listMode === 'group' || listMode === 'admin'"
          @click="removeData('multiple')" type="primary" icon="minus">{{sourceObj.deleteWord}}</Button>
          <Button @click="addHost" 
          v-if="listMode === 'product' || listMode === 'group'"
          type="primary" icon="plus">添加主机</Button>
          <Button :disabled="!disableObj.isRemove" type="primary"
          v-if="listMode === 'admin' || listMode === 'monitor' || listMode === 'product'" @click="appendHost">{{sourceObj.text}}</Button>
          <Dropdown placement="bottom-start" trigger="click" @on-click="awareData">
            <Button :disabled="!disableObj.isRemove" type="primary">静音</Button>
            <DropdownMenu slot="list">
              <DropdownItem name="1h">1h</DropdownItem>
              <DropdownItem name="4h">4h</DropdownItem>
              <DropdownItem name="8h">8h</DropdownItem>
              <DropdownItem name="1d">1天</DropdownItem>
              <DropdownItem name="1w">1周</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button :disabled="!disableObj.isRemove" @click="unMuteAllData">取消静音</Button>
        </div>
        <div class="float-right">
          <Checkbox v-if="listMode === 'admin' || listMode === 'monitor' || listMode === 'product'" v-model="unDistribute" @on-change="checkHost">未{{sourceObj.text}}</Checkbox>
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="box-content">
        <paging :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size" ref="page">
          <Table size="small" border
            ref="tablelist"
            :data="dataList" 
            :columns="columns"
            :loading="loading"
            no-data-text="暂无数据"
            @on-select-all="selectAll"
            @on-selection-change="selectItem"
            @on-sort-change="handleSort"
            ></Table>
        </paging>
      </div>
    </div>
    <create-host-group ref="addHost" @on-create-success="addSuccess"></create-host-group>
    <Modal :title="actionObj.title" v-model="removeModal" @on-cancel="deleteCancel">
      <Form :model="appendInfo" v-if="msgInfo === 'appendpro' || msgInfo === 'appendgroup'" ref="appendForm" :label-width="80">
        <FormItem prop="productId" v-if="msgInfo === 'appendpro'"
        :rules="{required: true, type: 'number', message: '请选择产品线', trigger: 'change'}" label="产品线">
          <Select v-model="appendInfo.productId" filterable ref="productSelect">
            <Option v-for="(item, index) in productList"
            :key="index"
            :value="item.id"
            :label="item.name">{{item.name}}</Option>
          </Select>
        </FormItem>
        <FormItem prop="groupId" v-if="msgInfo === 'appendgroup'"
        :rules="{required: true, type: 'number', message: '请选择主机组', trigger: 'change'}" label="主机组">
          <Select v-model="appendInfo.groupId">
            <Option v-for="(item, index) in groupList"
            :key="index"
            :value="item.id"
            :label="item.name">{{item.name}}</Option>
          </Select>
        </FormItem>
      </Form>
      <Alert type="warning" show-icon>确定要{{actionObj.title}}：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.hostname}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import axios from 'axios';
import Cookies from 'js-cookie';
import core from '../../mixins/core';
import bus from '../../libs/bus';
import {
  getHostOfPro,
  removeHostInPro,
  getHostOfGroup,
  removeHostInGroup,
  getAllHosts,
  deleteHost,
  getAllProducts,
  addHostInPro,
  getHostGroups,
  addHostInGroup,
  muteHost,
  unmuteHost,
} from '../../models/service';
import paging from '../page/paging';
import createHostGroup from './create-host-group';

export default {
  name: 'hostList',
  mixins: [core],
  components: {
    paging,
    createHostGroup,
  },
  props: {
    // 是否是产品列表页,true,是。false,不是
    isProduct: {
      type: Boolean,
      default: false,
    },
    // monitor:主机列表,admin:管理员主机,product:产品线下,group:主机组
    source: {
      type: String,
      default: 'monitor',
    },
  },
  data() {
    return {
      loading: false,
      dataList: [], // 表格数据,主机列表
      unDistribute: false, // 未分配主机
      filter: {
        page_size: 10,
        page: 1,
        productId: '',
        order: '',
      },
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        },
        {
          title: '主机名称',
          key: 'hostname',
          sortable: 'custom',
          minWidth: 180,
          render: (h, params) => h('router-link', {
            attrs: {
              title: '前往主机详情页',
              to: this.getViewRouter(params.row),
            },
            nativeOn: {
              click: () => {
                localStorage.setItem('hostAppname', 'default');
              },
            },
          }, params.row.name || params.row.hostname),
        }, {
          title: 'IP地址',
          key: 'ip',
          sortable: 'custom',
          width: 120,
        }, {
          title: '空闲率',
          key: 'idle_pct',
          width: 100,
          sortable: 'custom',
          render: (h, params) => h('span', {}, `${params.row.idle_pct}%`),
        }, {
          title: '持续运行时间',
          key: 'uptime',
          width: 180,
          sortable: 'custom',
          render: (h, params) => h('span', {}, this.getDuration(params.row.uptime)),
        }, {
          title: '剩余静音时间',
          width: 150,
          key: 'mute_time',
          sortable: 'custom',
          render: (h, params) => h('span', this.getTimeLast(params.row.mute_time)),
        }, {
          title: '状态',
          key: 'status',
          width: 80,
          align: 'center',
          sortable: 'custom',
          render: (h, params) => h('Badge', {
            props: {
              count: this.getHostStatus(params.row.status),
            },
            attrs: {
              class: this.getHostStatusClass(params.row.status),
            },
          }),
        }, {
          title: '插件数',
          key: 'plugin_cnt',
          width: 90,
          align: 'center',
          sortable: 'custom',
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '前往插件列表页',
            },
            on: {
              click: (event) => {
                event.stopPropagation();
                this.viewPlugin(params.row);
              },
            },
          }, params.row.plugin_cnt),
        }, {
          title: '主机组',
          key: 'host_groups',
          minWidth: 160,
          sortable: 'custom',
          renderHeader: h => h('span', this.listMode === 'admin' ? '产品线' : '主机组'),
          render: (h, params) => h('div', [this.listMode !== 'admin' && params.row.host_groups ? params.row.host_groups : '', this.listMode === 'admin' && params.row.products ? params.row.products : '']),
        }, {
          title: '操作',
          align: 'right',
          width: 100,
          render: (h, params) => h('div', {
            class: {
              clearfix: true,
            },
          }, [h('Poptip', {
            props: {
              placement: 'left',
              // value: params.row.muteVisible,
              trigger: 'hover',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'android-volume-off',
            },
            // nativeOn: {
            //   click: (event) => {
            //     event.stopPropagation();
            //     this.showMute(params.index);
            //   },
            // },
          }), h('div', {
            slot: 'content',
          }, [h('span', '静音：'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1h', params.row, params.index);
              },
            },
          }, '1h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('4h', params.row, params.index);
              },
            },
          }, '4h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('8h', params.row, params.index);
              },
            },
          }, '8h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1d', params.row, params.index);
              },
            },
          }, '1天'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1w', params.row, params.index);
              },
            },
          }, '1周')])]), h('Tooltip', {
            props: {
              content: '取消静音',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'android-volume-up',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.unMuteData(params.row);
              },
            },
          })]), this.listMode !== 'monitor' ? h('Tooltip', {
            props: {
              content: this.sourceObj.deleteWord,
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: this.sourceObj.deleteIcon,
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.removeData(params.row);
              },
            },
          })]) : '']),
        },
      ],
      groupId: '',
      total: 0, // 总数
      selectedData: [], // 选中数据
      statusList: [], // 筛选
      dataStatus: '', // 状态筛选
      searchName: '', // 搜索名称
      removeModal: false,
      deleteShowData: [], // 展示要移除的数据
      appendInfo: {
        productId: '',
        groupId: '',
      },
      productList: [],
      groupList: [],
      msgInfo: '',
      listMode: 'monitor',
    };
  },
  methods: {
    // 产品线添加主机
    addHost() {
      // 产品线下主机操作
      if (this.listMode === 'product') {
        // productInfo = localStorage.getItem('productItem');
        this.$refs.addHost.editInit({
          name: this.$route.query.product,
          id: this.filter.productId,
        }, 'addprohost');
      } else if (this.listMode === 'monitor') {
        // 普通户情况,获取产品线信息,prouct
        // productInfo = localStorage.getItem('productInfo');
        this.$refs.addHost.editInit({
          name: this.$route.query.product,
          id: this.filter.productId,
        }, 'addprohost');
      } else if (this.listMode === 'group') { // 主机组添加主机
        // this.groupItem
        this.$refs.addHost.editInit({
          name: this.$route.query.hostgroup,
          id: this.groupId,
        }, 'addgrouphost');
      }
    },
    // 将主机添加到产品线
    appendHost() {
      if (this.listMode === 'admin') {
        this.productList = [];
        this.getAllProducts();
        this.msgInfo = 'appendpro';
      } else if (this.listMode === 'monitor' || this.listMode === 'product') {
        this.getHostGroups();
        this.msgInfo = 'appendgroup';
      }
      this.removeModal = true;
      this.deleteShowData = this.selectedData.map((item) => {
        const host = Object.assign({}, item);
        return host;
      });
      if (this.$refs.productSelect) {
        this.$refs.productSelect.reset();
      }
    },
    // 添加主机回调
    addSuccess(msg, data) {
      if (data.code === 200) {
        this.$Message.success('添加成功');
        this.getData(this.filter);
      }
    },
    showMute(index) {
      this.dataList[index].muteVisible = true;
      this.dataList.forEach((item, i) => {
        const obj = item;
        if (i !== index) obj.muteVisible = false;
      });
    },
    // 静音告警
    awareData(name, obj, count) {
      const time = this.getAwareTime(name);
      if (obj) {
        // 操作一组
        this.dataList[count].muteVisible = false;
        const params = {
          hostId: obj.id,
          muteTime: time,
        };
        this.muteHost(params);
      } else if (this.selectedData.length) {
        const hostArr = this.selectedData.map(item => item.hostname);
        // 操作多个
        this.$Modal.confirm({
          title: '静音确认',
          content: `确认要静音以下主机 ${hostArr.join('，')} 吗`,
          onOk: () => {
            this.muteAllHost(time);
          },
        });
      }
    },
    // 静音告警,对接接口
    muteHost(params) {
      muteHost(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success('已静音成功');
          this.getData(this.filter);
        }
      });
    },
    // 静音多个
    muteAllHost(time) {
      const awareArr = this.selectedData.map(item => muteHost({
        hostId: item.id,
        muteTime: time,
      }));
      axios.all(awareArr).then((all) => {
        if (all.length === this.selectedData.length) {
          let flag = true;
          all.forEach((res) => {
            if (res.status !== 200) {
              flag = false;
            }
          });
          if (flag) {
            this.$Message.success('已静音成功');
            this.getData(this.filter);
          } else {
            this.$Message.srror('静音失败');
          }
        } else {
          this.$Message.srror('静音失败');
        }
      });
    },
    unMuteData(obj) {
      if (obj) {
        const params = {
          hostId: obj.id,
        };
        this.$Modal.confirm({
          title: '取消静音',
          content: `确定要将主机： ${obj.hostname} 取消静音吗?`,
          onOk: () => {
            this.unmuteHost(params);
          },
        });
      }
    },
    unMuteAllData() {
      if (this.selectedData.length) {
        const hostArr = this.selectedData.map(item => item.hostname);
        // 操作多个
        this.$Modal.confirm({
          title: '取消静音',
          content: `确认要将以下主机 ${hostArr.join('，')} 取消静音吗`,
          onOk: () => {
            this.unmuteAllHost();
          },
        });
      }
    },
    // 取消静音多个
    unmuteAllHost() {
      const awareArr = this.selectedData.map(item => unmuteHost({
        hostId: item.id,
      }));
      axios.all(awareArr).then((all) => {
        if (all.length === this.selectedData.length) {
          let flag = true;
          all.forEach((res) => {
            if (res.status !== 200) {
              flag = false;
            }
          });
          if (flag) {
            this.$Message.success('取消静音成功');
            this.getData(this.filter);
          } else {
            this.$Message.srror('取消静音失败');
          }
        } else {
          this.$Message.srror('取消静音失败');
        }
      });
    },
    // 取消静音,对接接口
    unmuteHost(params) {
      unmuteHost(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success('取消静音成功');
          this.getData(this.filter);
        }
      });
    },
    // 移除主机
    removeData(obj) {
      this.msgInfo = 'delete';
      if (obj === 'multiple') { // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 移除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 移除主机确认
    deleteConfirm() {
      if (this.deleteShowData.length) {
        if (this.msgInfo === 'delete') {
          this.removeModal = false;
          if (this.listMode === 'product') {
            this.removeHostInPro();
          } else if (this.listMode === 'group') {
            this.removeHostInGroup();
          } else if (this.listMode === 'admin') {
            this.deleteHost();
          }
        } else if (this.msgInfo === 'appendpro') {
          this.$refs.appendForm.validate((valid) => {
            if (valid) {
              this.addHostInPro();
            }
          });
        } else if (this.msgInfo === 'appendgroup') {
          this.$refs.appendForm.validate((valid) => {
            if (valid) {
              this.addHostInGroup();
            }
          });
        }
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
      if (this.$refs.appendForm) {
        this.$refs.appendForm.resetFields();
      }
    },
    // 从产品线移除成功
    removeHostInPro() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        ids: arr,
        productId: this.filter.productId,
      };
      removeHostInPro(params).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 从主机组删除接口
    removeHostInGroup() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        productId: this.filter.productId,
        groupId: this.groupId,
        ids: arr,
      };
      removeHostInGroup(params).then((res) => {
        if (res.status === 200) {
          this.initFilter();
          this.selectedData = [];
          this.deleteShowData = [];
          this.removeModal = false;
          this.$Message.success('删除成功');
        }
      });
    },
    // 删除主机
    deleteHost() {
      const arr = this.deleteShowData.map((item) => {
        const params = {
          hostId: item.id,
        };
        return deleteHost(params);
      });
      axios.all(arr).then((res) => {
        if (res.length > 0) {
          let flag = true;
          res.forEach((item) => {
            if (item.status !== 200 || item.data.code !== 200) {
              flag = false;
            }
          });
          if (flag) {
            this.selectedData = [];
            this.deleteShowData = [];
            this.initFilter();
            this.removeModal = false;
            this.$Message.success('删除成功');
          } else {
            this.$Message.error('删除失败');
          }
        }
      });
    },
    // 查看主机详情
    getViewRouter(item) {
      if (this.listMode === 'product' || this.listMode === 'monitor') {
        return {
          path: `/monitor/host/detail/${item.id}/${this.filter.productId}`,
          query: { product: this.$route.query.product },
        };
      }
      if (this.listMode === 'group') {
        return {
          path: `/monitor/grouphost/${item.id}/${this.groupId}/${this.filter.productId}`,
          query: {
            product: this.$route.query.product,
            hostgroup: this.$route.query.hostgroup,
          },
        };
      }
      if (this.listMode === 'admin') {
        return {
          path: `/admin/monitor/host/detail/${item.id}`,
        };
      }
      return {
        path: `/admin/monitor/host/detail/${item.id}`,
      };
    },
    // 查看插件
    viewPlugin(item) {
      if (this.listMode === 'product' || this.listMode === 'monitor') {
        this.$router.push({
          path: `/monitor/host/plugin/${item.id}/${this.filter.productId}`,
          query: {
            product: this.$route.query.product,
          },
        });
      } else if (this.listMode === 'group') {
        this.$router.push({
          path: `/monitor/group/plugin/${item.id}/${this.groupId}/${this.filter.productId}`,
          query: {
            product: this.$route.query.product,
            hostgroup: this.$route.query.hostgroup,
          },
        });
      } else if (this.listMode === 'admin') {
        this.$router.push({
          path: `/admin/monitor/host/plugin/${item.id}`,
        });
      }
    },
    // 获取表格内容数据
    getData(params) {
      this.loading = true;
      this.selectedData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      if (this.listMode === 'product' || this.listMode === 'monitor') {
        // delete obj.groupId;
        getHostOfPro(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts.map((item) => {
              const hostobj = item;
              hostobj.muteVisible = false;
              return hostobj;
            });
          } else {
            this.total = 0;
            this.dataList = [];
          }
          this.loading = false;
        });
      } else if (this.listMode === 'group') {
        getHostOfGroup(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts.map((item) => {
              const hostobj = item;
              hostobj.muteVisible = false;
              return hostobj;
            });
          } else {
            this.total = 0;
            this.dataList = [];
          }
          this.loading = false;
        });
      } else if (this.listMode === 'admin') {
        delete obj.productId;
        getAllHosts(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts.map((item) => {
              const hostobj = item;
              hostobj.muteVisible = false;
              return hostobj;
            });
          } else {
            this.total = 0;
            this.dataList = [];
          }
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 翻页
    pageInfoChange(filter) {
      // this.setInitPage(filter.pageSize);
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      let order = '';
      if (value.key === 'host_groups') {
        const key = this.listMode === 'admin' ? 'products' : 'groups';
        order = value.order === 'normal' ? '' : `${key}|${value.order}`;
      } else {
        order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      }
      this.filter.order = order;
      this.initFilter();
    },
    // 选择未分配/分组主机
    checkHost(value) {
      if (value) {
        if (this.listMode === 'admin') {
          this.filter.no_product = true;
        } else if (this.listMode === 'monitor' || this.listMode === 'product') {
          this.filter.no_group = true;
        }
        this.initFilter();
      } else {
        delete this.filter.no_product;
        delete this.filter.no_group;
        this.initFilter();
      }
    },
    // 查看主机组
    groupToStr(arr) {
      if (arr.length) {
        const gArr = arr.map(item => item.name);
        return gArr.join('/');
      }
      return '无主机组';
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.$refs.page.init();
      this.filter.query = this.searchName.trim();
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 初始化
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      if (this.listMode === 'group') {
        this.groupId = parseInt(this.$route.params.groupId, 10);
        this.filter.groupId = this.groupId;
      }
      this.getData(this.filter);
    },
    // 给产品线添加主机
    addHostInPro() {
      const arr = this.selectedData.map(item => item.id);
      const params = {
        productId: this.appendInfo.productId,
        ids: arr,
      };
      if (this.selectedData.length > 0) {
        addHostInPro(params).then((res) => {
          if (res.status === 200) {
            this.selectedData = [];
            this.deleteShowData = [];
            this.$Message.success('主机分配成功');
            this.appendInfo.productId = '';
            this.removeModal = false;
            this.initFilter();
            if (this.$refs.appendForm) {
              this.$refs.appendForm.resetFields();
            }
          }
        });
      } else {
        this.$Message.warning('未选择主机');
      }
    },
    // 给主机组添加主机
    addHostInGroup() {
      const arr = this.selectedData.map(item => item.id);
      const params = {
        productId: this.filter.productId,
        groupId: this.appendInfo.groupId,
        ids: arr,
      };
      if (this.selectedData.length > 0) {
        addHostInGroup(params).then((res) => {
          if (res.status === 200) {
            this.selectedData = [];
            this.deleteShowData = [];
            this.$Message.success('主机分组成功');
            this.appendInfo.groupId = '';
            this.removeModal = false;
            this.initFilter();
            if (this.$refs.appendForm) {
              this.$refs.appendForm.resetFields();
            }
          }
        });
      } else {
        this.$Message.warning('未选择主机');
      }
    },
    // 获取全部产品线
    getAllProducts() {
      getAllProducts({
        paging: false,
      }).then((res) => {
        if (res.status === 200) {
          this.productList = res.data.products;
        } else {
          this.productList = [];
        }
      });
    },
    // 获取主机组
    getHostGroups() {
      getHostGroups({
        productId: this.filter.productId,
        paging: false,
      }).then((res) => {
        if (res.status === 200) {
          this.groupList = res.data.host_groups;
        } else {
          this.groupList = [];
        }
      });
    },
    getDuration(time) {
      if (time) {
        let minute = time / 60;
        let hour = 0;
        let day = 0;
        let year = 0;
        if (minute >= 1440) {
          hour = Math.floor(minute / 60);
          day = Math.floor(hour / 24);
          hour = Math.floor(hour % 24);
          minute = Math.floor(minute % 60);
          if (day >= 365) {
            year = Math.floor(day / 365);
            day = Math.floor(day % 365);
            return `${year}年${day}天${hour}小时${minute}分`;
          }
          return `${day}天${hour}小时${minute}分`;
        } else if (minute >= 60 && minute < 1440) {
          hour = Math.floor(minute / 60);
          minute = Math.floor(minute % 60);
          return `${hour}小时${minute}分`;
        }
        return `${Math.floor(minute)}分`;
      }
      return time;
    },
    getHostStatus(arg) {
      const status = parseInt(arg, 10);
      let str = '';
      switch (status) {
        case 0:
          str = '宕机';
          break;
        case 1:
          str = '正常';
          break;
        case 3:
          str = '新增';
          break;
        default:
          str = '未知';
          break;
      }
      return str;
    },
    getHostStatusClass(arg) {
      const status = parseInt(arg, 10);
      let str = '';
      switch (status) {
        case 0:
          str = 'alert-count ivu-badge';
          break;
        case 1:
          str = 'ok-count ivu-badge';
          break;
        case 3:
          str = 'add-count ivu-badge';
          break;
        default:
          str = 'unknow-count ivu-badge';
          break;
      }
      return str;
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    numberSeparator(value) {
      if (value) {
        return value.toString().indexOf('.') > 0 ?
        value.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
         : value.toString().replace(/\B(?=(\d{3})+$)/g, ',');
      }
      return 0;
    },
    // 获取时间
    getAwareTime(name) {
      if (name) {
        const now = new Date();
        if (name.indexOf('h') > -1) {
          const hour = parseInt(name.slice(0, name.length - 1), 10);
          now.setHours(now.getHours() + hour);
        } else if (name.indexOf('d') > -1) {
          const day = parseInt(name.slice(0, name.length - 1), 10);
          now.setDate(now.getDate() + day);
        } else if (name.indexOf('w') > -1) {
          const week = parseInt(name.slice(0, name.length - 1), 10);
          now.setDate(now.getDate() + (week * 7));
        }
        const time = bus.timeFormate(now, 'yyyy-MM-dd hh:mm:ss');
        return time;
      }
      return '';
    },
    setTimeFormat(time) {
      if (time) {
        return bus.timeFormate(time, 'yyyy-MM-dd hh:mm:ss');
      }
      return time;
    },
    // 获取持续时间
    getTimeLast(time) {
      const now = new Date();
      const end = new Date(time);
      if (now > end) return '--';
      const num = end.getTime() - now.getTime();
      if (num > 0) {
        const seconds = Math.ceil(num / 1000);
        if (seconds >= 60) {
          // const minutes = Math.floor(seconds / 60);
          const minutes = seconds / 60;
          if (minutes >= 60) {
            const hours = minutes / 60;
            if (hours >= 24) {
              const days = hours / 24;
              return `${Math.floor(days)}天${Math.floor(hours) % 24}小时
              ${Math.floor(minutes) % 60}分${seconds % 60}秒`;
            }
            return `${Math.floor(hours) % 24}小时
              ${Math.floor(minutes) % 60}分${seconds % 60}秒`;
          }
          return `${Math.floor(minutes) % 60}分${seconds % 60}秒`;
        }
        return `${seconds % 60}秒`;
      }
      return time;
    },
  },
  computed: {
    sourceObj() {
      const obj = {
        deleteWord: '',
        deleteIcon: '',
        text: '',
      };
      if (this.listMode === 'product') {
        obj.deleteWord = '产品线移除';
        obj.deleteIcon = 'ios-minus-outline';
        obj.text = '分组主机';
      } else if (this.listMode === 'group') {
        obj.deleteWord = '主机组移除';
        obj.deleteIcon = 'ios-minus-outline';
      } else if (this.listMode === 'admin') {
        obj.deleteWord = '删除';
        obj.deleteIcon = 'trash-a';
        obj.text = '分配主机';
      } else if (this.listMode === 'monitor') {
        obj.text = '分组主机';
      }
      return obj;
    },
    actionObj() {
      const obj = {
        title: '',
        text: '',
      };
      if (this.msgInfo === 'delete') {
        if (this.listMode === 'admin') {
          obj.title = '删除主机';
        } else {
          obj.title = '移除主机';
        }
      } else if (this.msgInfo === 'appendpro') {
        obj.title = '分配主机';
        obj.text = '分配';
      } else if (this.msgInfo === 'appendgroup') {
        obj.title = '分组主机';
        obj.text = '分组';
      }
      return obj;
    },
    tableHeight() {
      if (this.dataList.length) {
        if (this.dataList.length > 10) {
          return 520;
        }
        return 40 + (this.dataList.length * 48);
      }
      return 88;
    },
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
        };
      }
      return {
        isRemove: false,
      };
    },
  },
  created() {
    const owlRole = Cookies.get('owl_role');
    if (this.source === 'monitor' && this.roleMd5 === owlRole) {
      this.listMode = 'product';
    } else {
      this.listMode = this.source;
    }
  },
  mounted() {
    this.getDetailData();
  },
};

</script>
