<style lang="scss">
  @import './admin-plugin-list.scss';
</style>
<template>
  <div class="main-container admin-plugin-list"> 
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-left">
          <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除插件</Button>
          <Button type="primary" icon="plus" @click="createData">创建插件</Button>
        </div>
        <div class="float-right">
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="table-list group-list">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page" :pageSize="filter.page_size">
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
    </div>
    <create-plugin ref="createPlugin" @on-create-success="createSuccess"></create-plugin>
    <Modal title="移除插件" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除插件：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
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
import core from '../../mixins/core';
// import bus from '../../libs/bus';
import { getAllPlugins, deletePlugin } from '../../models/service';
import createPlugin from '../../components/admin/plugin/create-plugin';
import paging from '../../components/page/paging';

export default {
  name: 'monitorGroup',
  mixins: [core],
  components: {
    createPlugin,
    paging,
  },
  data() {
    return {
      loading: false,
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
      },
      total: 0, // 总数
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      statusList: [], // 筛选
      dataStatus: '',
      searchName: '', // 搜索名称
      deleteShowData: [],
      removeModal: false,
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '插件名称',
          key: 'name',
          width: 160,
          render: (h, params) => h('span', params.row.name),
          // render: (h, params) => h('a', {
          //   attrs: {
          //     title: params.row.name,
          //   },
          //   on: {
          //     click: () => {
          //       this.viewDetail(params.row);
          //     },
          //   },
          // }, params.row.name),
        }, {
          title: '执行参数',
          key: 'args',
          minWidth: 150,
        }, {
          title: '执行间隔(秒)',
          key: 'interval',
          width: 120,
        }, {
          title: '超时时间(秒)',
          key: 'timeout',
          width: 120,
        }, {
          title: '插件路径',
          key: 'path',
          width: 150,
        }, {
          title: '校验和',
          key: 'checksum',
          width: 240,
        }, {
          title: '备注',
          key: 'comment',
          width: 140,
        }, {
          title: '操作',
          align: 'right',
          width: 100,
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: '编辑',
              placement: 'top',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'edit',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.editPlugin(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '删除',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'trash-a',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.removeData(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  computed: {
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
  methods: {
    // 创建插件
    createData() {
      this.$refs.createPlugin.editInit('create');
    },
    // 创建成功回调
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        this.reload();
        if (msg === 'create') { // 创建成功后跳转到插件详情页
          this.$Message.success('创建成功');
        } else if (msg === 'editPlugin') {
          this.$Message.success('编辑成功');
        }
      }
    },
    // 编辑插件
    editPlugin(group) {
      this.$refs.createPlugin.editInit('editPlugin', group);
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除插件
    removeData(obj) {
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
    // 移除插件确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deletePlugin();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除接口
    deletePlugin() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deletePlugin({
            pluginId: item.id,
          }));
        });
        axios.all(api).then(() => {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        });
      }
    },
    // 查看详情
    viewDetail(item) {
      this.$router.push({
        path: `/admin/plugin/plugindetail/${item.id}`,
        query: { plugin: item.name },
      });
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 获取表格内容数据
    getData(params) {
      this.loading = true;
      this.selectedData = [];
      this.checkAll = false;
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getAllPlugins(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.plugins;
        } else {
          this.total = 0;
          this.dataList = [];
        }
        this.loading = false;
      });
    },
    pageInfoChange(filter) {
      // this.setInitPage(filter.pageSize);
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
    doNothing() {},
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.filter.query = this.searchName.trim();
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
  },
  created() {
  },
  mounted() {
    this.getData(this.filter);
  },
};

</script>
