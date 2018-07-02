<style lang="scss">
  @import './host-list.scss'
</style>
<template>
  <div class="common-host-list">
    <div class="table-list host-list">
      <div class="table-list-header clearfix mb-10">
        <div class="float-left">
          <Button :disabled="!disableObj.isRemove" 
          v-if="source === 'product' || source === 'group' || source === 'admin'"
          @click="removeData('multiple')" type="primary" icon="minus">{{sourceObj.deleteWord}}</Button>
          <Button @click="addHost" 
          v-if="source === 'product' || source === 'group'"
          type="primary" icon="plus">添加主机</Button>
          <Button :disabled="!disableObj.isRemove || !unDistribute" 
          type="primary"
          v-if="unDistribute && (source === 'admin' || source === 'monitor')" @click="appendHost">{{sourceObj.text}}</Button>
        </div>
        <div class="float-right">
          <Checkbox v-if="source === 'admin' || source === 'monitor'" v-model="unDistribute" @on-change="checkHost">未{{sourceObj.text}}</Checkbox>
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="box-content">
        <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
          <Table slot="listTable" size="small" border
            ref="tablelist"
            :data="dataList" 
            :columns="columns"
            no-data-text="暂无数据"
            @on-select-all="selectAll"
            @on-selection-change="selectItem"
            @on-sort-change="handleSort"
            ></Table>
        </paging>
      </div>
    </div>
    <create-host-group ref="addHost" @on-create-success="addSuccess"></create-host-group>
    <Modal :title="actionObj.title" v-model="removeModal">
      <Form :model="appendInfo" v-if="msgInfo === 'appendpro' || msgInfo === 'appendgroup'" ref="appendForm" :label-width="80">
        <Form-item prop="productId" v-if="msgInfo === 'appendpro'"
        :rules="{required: true, type: 'number', message: '请选择产品线', trigger: 'change'}" label="产品线">
          <Select v-model="appendInfo.productId">
            <Option v-for="(item, index) in productList"
            :key="index"
            :value="item.id"
            :label="item.name">{{item.name}}</Option>
          </Select>
        </Form-item>
        <Form-item prop="groupId" v-if="msgInfo === 'appendgroup'"
        :rules="{required: true, type: 'number', message: '请选择主机组', trigger: 'change'}" label="主机组">
          <Select v-model="appendInfo.groupId">
            <Option v-for="(item, index) in groupList"
            :key="index"
            :value="item.id"
            :label="item.name">{{item.name}}</Option>
          </Select>
        </Form-item>
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
// import bus from '../../libs/bus';
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
} from '../../models/service';
import paging from '../page/paging';
import createHostGroup from './create-host-group';

export default {
  name: 'hostList',
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
          render: (h, params) => h('a', {
            attrs: {
              title: '前往主机详情页',
              // eslint-disable-next-line
              href: 'javascript:;',
            },
            on: {
              click: () => {
                this.viewDetail(params.row, 'default');
              },
            },
          }, params.row.name || params.row.hostname),
        }, {
          title: 'IP地址',
          key: 'ip',
          sortable: 'custom',
          width: 120,
        }, {
          title: '状态',
          key: 'status',
          width: 80,
          align: 'center',
          render: (h, params) => h('Badge', {
            props: {
              count: this.getHostStatus(params.row.status),
            },
            attrs: {
              class: this.getHostStatusClass(params.row.status),
            },
          }),
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
          title: '插件数',
          key: 'plugin_cnt',
          // sortable: 'custom',
          width: 80,
          align: 'center',
          render: (h, params) => h('a', {
            attrs: {
              title: '前往插件列表页',
              // eslint-disable-next-line
              href: 'javascript:;',
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
          renderHeader: h => h('span', this.source === 'admin' ? '产品线' : '主机组'),
          render: (h, params) => h('div', [this.source !== 'admin' && params.row.host_groups ? h('div', params.row.host_groups.map((item, gIndex) => h('span', {
          }, gIndex === 0 ? item.name : `, ${item.name}`))) : '', this.source === 'admin' && params.row.products ? h('div', params.row.products.map((item, gIndex) => h('span', {
          }, gIndex === 0 ? item.name : `, ${item.name}`))) : '']),
        },
      ],
      groupItem: null, // 主机组信息
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
    };
  },
  methods: {
    initColumn() {
      // source === 'product' || source === 'group' || source === 'admin'
      if (this.source !== 'monitor') {
        // this.columns.unshift({
        //   type: 'selection',
        //   width: 60,
        //   align: 'center',
        // });
        this.columns.push({
          title: '操作',
          align: 'right',
          width: 120,
          render: (h, params) => h('div', {
            class: {
              clearfix: true,
            },
          }, [this.source !== 'monitor' ? h('div', {
            class: {
              'float-right': true,
            },
          }, [h('Tooltip', {
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
          })])]) : '']),
        });
      }
    },
    // 产品线添加主机
    addHost() {
      let productInfo = '';
      // 产品线下主机操作
      if (this.source === 'product') {
        productInfo = localStorage.getItem('productItem');
        if (productInfo) {
          this.$refs.addHost.editInit(JSON.parse(productInfo), 'addprohost');
        }
      } else if (this.source === 'monitor') {
        // 普通户情况,获取产品线信息,prouct
        productInfo = localStorage.getItem('productInfo');
        if (productInfo) {
          this.$refs.addHost.editInit(JSON.parse(productInfo), 'addprohost');
        }
      } else if (this.source === 'group') { // 主机组添加主机
        this.$refs.addHost.editInit(this.groupItem, 'addgrouphost');
      }
    },
    // 将主机添加到产品线
    appendHost() {
      if (this.source === 'admin') {
        this.getAllProducts();
        this.msgInfo = 'appendpro';
      } else if (this.source === 'monitor') {
        this.getHostGroups();
        this.msgInfo = 'appendgroup';
      }
      this.removeModal = true;
      this.deleteShowData = this.selectedData.map((item) => {
        const host = Object.assign({}, item);
        return host;
      });
    },
    // 添加出击回调
    addSuccess(msg, data) {
      if (data.code === 200) {
        this.$Message.success('添加成功');
        this.getData(this.filter);
      }
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
          if (this.source === 'product') {
            this.removeHostInPro();
          } else if (this.source === 'group') {
            this.removeHostInGroup();
          } else if (this.source === 'admin') {
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
    // 查看详情
    viewDetail(item, appname) {
      localStorage.setItem('hostItemInfo', JSON.stringify(item));
      if (appname) {
        localStorage.setItem('hostAppname', appname);
      }
      if (this.source === 'product') {
        this.$router.push({
          path: `/admin/product/host/detail/${item.id}/${this.filter.productId}`,
        });
      } else if (this.source === 'monitor') {
        this.$router.push({
          path: `/monitor/host/detail/${item.id}/${this.filter.productId}`,
        });
      } else if (this.source === 'group') {
        this.$router.push({
          path: `/monitor/grouphost/${item.id}/${this.groupId}/${this.filter.productId}`,
        });
      } else if (this.source === 'admin') {
        this.$router.push({
          path: `/admin/monitor/host/detail/${item.id}`,
        });
      }
    },
    viewGroup(host, group) {
      localStorage.setItem('groupItem', JSON.stringify(group));
      // 需要使用产品线id，产品线id需要从group中获取
      this.$router.push({
        path: `/monitor/groupd/etail/${group.id}/${this.filter.productId}`,
      });
    },
    viewPlugin(item) {
      localStorage.setItem('hostItemInfo', JSON.stringify(item));
      if (this.source === 'product') {
        this.$router.push({
          path: `/admin/product/host/plugin/${item.id}/${this.filter.productId}`,
        });
      } else if (this.source === 'monitor') {
        this.$router.push({
          path: `/monitor/host/plugin/${item.id}/${this.filter.productId}`,
        });
      } else if (this.source === 'group') {
        this.$router.push({
          path: `/monitor/group/plugin/${item.id}/${this.groupId}/${this.filter.productId}`,
        });
      } else if (this.source === 'admin') {
        this.$router.push({
          path: `/admin/monitor/host/plugin/${item.id}`,
        });
      }
    },
    // 获取表格内容数据
    getData(params) {
      this.selectedData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      if (this.source === 'product' || this.source === 'monitor') {
        // delete obj.groupId;
        getHostOfPro(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts;
          } else {
            this.total = 0;
            this.dataList = [];
          }
        });
      } else if (this.source === 'group') {
        getHostOfGroup(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts;
          } else {
            this.total = 0;
            this.dataList = [];
          }
        });
      } else if (this.source === 'admin') {
        delete obj.productId;
        getAllHosts(obj).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.hosts;
          } else {
            this.total = 0;
            this.dataList = [];
          }
        });
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
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // 选择未分配主机
    checkHost(value) {
      if (value) {
        if (this.source === 'admin') {
          this.filter.no_product = true;
        } else if (this.source === 'monitor') {
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
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 初始化
    getDetailData() {
      this.initColumn();
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      if (this.source === 'group') {
        const groupItem = localStorage.getItem('groupItem');
        this.groupItem = JSON.parse(groupItem);
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
  },
  computed: {
    sourceObj() {
      const obj = {
        deleteWord: '',
        deleteIcon: '',
        text: '',
      };
      if (this.source === 'product' || this.source === 'group') {
        obj.deleteWord = '移除';
        obj.deleteIcon = 'ios-minus-outline';
      } else if (this.source === 'admin') {
        obj.deleteWord = '删除';
        obj.deleteIcon = 'trash-a';
        obj.text = '分配主机';
      } else if (this.source === 'monitor') {
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
        if (this.source === 'admin') {
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
  mounted() {
    this.getDetailData();
  },
};

</script>
