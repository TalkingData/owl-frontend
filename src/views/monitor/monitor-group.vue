<style lang="scss">
  @import './monitor-group.scss';
</style>
<template>
  <div class="main-container monitor-group">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-left">
          <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除主机组</Button>
          <Button type="primary" icon="plus" @click="createData">创建主机组</Button>
        </div>
        <div class="float-right">
          <Checkbox v-model="isMyGroup" @on-change="checkMy">我的主机组</Checkbox>
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="table-list group-list">
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
    </div>
    <create-host-group ref="createGroup" @on-create-success="createSuccess"></create-host-group>
    <Modal title="移除主机组" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除主机组：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteCancel">取消</Button>
        <Button @click="deleteConfirm" type="primary">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import axios from 'axios';
import core from '../../mixins/core';
import { getHostGroups, delHostGroup } from '../../models/service';
import createHostGroup from '../../components/monitor/create-host-group';
import paging from '../../components/page/paging';

export default {
  name: 'monitorGroup',
  mixins: [core],
  components: {
    createHostGroup,
    paging,
  },
  data() {
    return {
      loading: false,
      isMyGroup: true,
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
        productId: '',
        order: '',
        my: true,
      },
      total: 0, // 总数
      selectedData: [], // 选中数据
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
          title: '主机组名称',
          key: 'name',
          sortable: 'custom',
          minWidth: 180,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看主机组',
            },
            on: {
              click: () => {
                this.viewDetail(params.row);
              },
            },
          }, params.row.name),
        }, {
          title: '描述',
          key: 'description',
          sortable: 'custom',
          minWidth: 180,
        }, {
          title: '主机',
          key: 'host_cnt',
          width: 80,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看主机组主机',
            },
            on: {
              click: () => {
                this.viewDetail(params.row, 'host');
              },
            },
          }, params.row.host_cnt || '0'),
        }, {
          title: '策略',
          key: 'strategy_cnt',
          width: 80,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看主机组策略',
            },
            on: {
              click: () => {
                this.viewDetail(params.row, 'rule');
              },
            },
          }, params.row.strategy_cnt || '0'),
        }, {
          title: '插件',
          key: 'plugin_cnt',
          width: 80,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看主机组插件',
            },
            on: {
              click: () => {
                this.viewDetail(params.row, 'plugin');
              },
            },
          }, params.row.plugin_cnt || '0'),
        }, {
          title: '创建人',
          key: 'creator',
          sortable: 'custom',
          minWidth: 200,
        }, {
          title: '创建时间',
          key: 'create_at',
          sortable: 'custom',
          width: 180,
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
                this.editGroup(params.row);
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
    // 创建主机组
    createData() {
      this.$refs.createGroup.createInit('create');
    },
    // 创建成功回调
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') { // 创建成功后跳转到主机组详情页
          this.initFilter();
          this.$Message.success('创建成功');
          this.viewDetail(data.host_group);
        } else if (msg === 'editgroup') {
          this.$Message.success('编辑成功');
          this.getData(this.filter);
        }
      }
    },
    // 编辑主机组
    editGroup(group) {
      this.$refs.createGroup.editInit(group, 'editgroup');
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除主机组
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
    // 移除主机组确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.delHostGroup();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除成功
    delHostGroup() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(delHostGroup({
            groupId: item.id,
            productId: this.filter.productId,
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
    viewDetail(item, name) {
      if (name) {
        localStorage.setItem('group_detail_tab', name);
      } else {
        localStorage.removeItem('group_detail_tab');
      }
      this.$router.push({
        path: `/monitor/group/detail/${item.id}/${this.filter.productId}`,
        query: {
          product: this.$route.query.product,
          hostgroup: item.name,
        },
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
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getHostGroups(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.host_groups;
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
    checkMy(value) {
      if (value) {
        this.filter.my = true;
        this.initFilter();
      } else {
        delete this.filter.my;
        this.initFilter();
      }
    },
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
      this.filter.query = this.searchName.trim();
      this.initFilter();
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
  },
  created() {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
  },
};

</script>
