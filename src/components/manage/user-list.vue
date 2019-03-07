<style lang="scss">
@import './user-list.scss';

</style>
<template>
  <div class="main-list-content">
    <div class="table-list user-list">
      <div class="table-list-header clearfix  mb-10">
        <div class="float-left">
          <Button @click="removeData('multiple')" :disabled="!disableObj.isRemove" icon="minus" type="primary">移除用户</Button>
          <Button type="primary" icon="plus" @click="createData">添加用户</Button>
        </div>
        <div class="float-right">
          <Input style="width:200px;" 
          v-model="searchName" 
          @on-change="search" 
          placeholder="输入关键字检索"
          ></Input>
          <!-- @on-click="clearSearch"
          icon="close-round" -->
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="box-content">
        <paging ref="userList" :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size">
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
    <create-user-group ref="createUserGroup" @on-create-success="createSuccess"></create-user-group>
    <Modal title="移除用户" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除用户：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.username}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteCancel">取消</Button>
        <Button @click="deleteConfirm" type="primary">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import Cookies from 'js-cookie';
import core from '../../mixins/core';
// import bus from '../../libs/bus';
import { removeUserInPro, getUserOfPro, getUserOfGroup, removeUserInGroup } from '../../models/service';
import paging from '../../components/page/paging';
import createUserGroup from '../../components/manage/create-user-group';

export default {
  name: 'userList',
  mixins: [core],
  components: {
    paging,
    createUserGroup,
  },
  props: {
    // 是否是产品列表页,true,是。false,不是
    isProduct: {
      type: Boolean,
      default: false,
    },
    // manage,group,product,admin
    source: {
      type: String,
      default: 'manage',
    },
  },
  data() {
    return {
      listMode: 'manage',
      loading: false,
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      alarmStatus: 0, // 全部默认
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
        order: '',
      },
      groupId: 0,
      total: 0,
      selectedData: [], // 选中数据
      removeModal: false,
      deleteShowData: [],
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '用户名称',
          key: 'username',
          sortable: 'custom',
          minWidth: 150,
        }, {
          title: '邮箱',
          key: 'mail',
          sortable: 'custom',
          minWidth: 150,
        }, {
          title: '角色',
          key: 'role',
          sortable: 'custom',
          width: 100,
          render: (h, params) => h('span', this.getRoleStr(params.row.role)),
        }, {
          title: '手机',
          key: 'phone',
          sortable: 'custom',
          width: 150,
        }, {
          title: '企业微信',
          key: 'wechat',
          sortable: 'custom',
          minWidth: 150,
        }, {
          title: '操作',
          align: 'right',
          width: 100,
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: '移除',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'ios-minus-outline',
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
  methods: {
    // 添加数据
    createData() {
      // 产品线中数据,获取产品线信息,admin-product
      if (this.source === 'product') {
        // productInfo = localStorage.getItem('productItem');
        this.$refs.createUserGroup.editInit({
          id: this.filter.productId,
          name: this.$route.query.product,
        }, 'addprouser');
      } else if (this.source === 'manage') {
        // 普通户情况,获取产品线信息,prouct
        // productInfo = localStorage.getItem('productInfo');
        this.$refs.createUserGroup.editInit({
          id: this.filter.productId,
          name: this.$route.query.product,
        }, 'addprouser');
      } else if (this.source === 'group') {
        // this.userGroupItem
        this.$refs.createUserGroup.editInit({
          id: this.groupId,
          name: this.$route.query.usergroup,
        }, 'addgroupuser');
      }
    },
    // 添加成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        this.$Message.success('添加成功');
        this.getData(this.filter);
      }
    },
    // 移除用户
    removeData(obj) {
      if (obj === 'multiple') {
        // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else {
        // 移除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 移除用户确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        if (this.source === 'product' || this.source === 'manage') {
          this.removeUserInPro();
        } else if (this.source === 'group') {
          this.removeUserInGroup();
        }
      }
    },
    // 从产品线移除成功
    removeUserInPro() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        ids: arr,
        productId: this.filter.productId,
      };
      removeUserInPro(params).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 从用户组删除成功
    removeUserInGroup() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        groupId: this.groupId,
        ids: arr,
        productId: this.filter.productId,
      };
      removeUserInGroup(params).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.query = this.searchName.trim();
      this.initFilter();
    }, 300),
    clearSearch() {
      this.searchName = '';
      this.filter.query = '';
      this.initFilter();
    },
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
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
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.userList.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // 获取数据
    getData(params) {
      this.loading = true;
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      if (this.source === 'manage' || this.source === 'product') {
        delete param.groupId;
        getUserOfPro(param).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.users;
          } else {
            this.total = 0;
            this.dataList = [];
          }
          this.loading = false;
        });
      } else if (this.source === 'group') {
        getUserOfGroup(param).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.users;
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
    // 初始化获取数据
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      if (this.source === 'group') {
        this.groupId = parseInt(this.$route.params.usergroupId, 10); // 用户组id
        this.filter.groupId = this.groupId;
      }
      this.getData(this.filter);
    },
    // 用户角色展示
    getRoleStr(num) {
      return num === 1 ? '管理员' : '用户';
    },
    // 用户角色展示
    getStatusStr(num) {
      return num === 1 ? '启用' : '禁用';
    },
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isCorrelate: true,
        };
      }
      return {
        isRemove: false,
        isCorrelate: false,
      };
    },
  },
  watch: {
  },
  created() {
    const owlRole = Cookies.get('owl_role');
    if (this.source === 'manage' && this.roleMd5 === owlRole) {
      this.listMode = 'product';
    } else {
      this.listMode = this.source;
    }
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {},
};

</script>
