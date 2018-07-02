<style lang="scss">
@import './user-group-list.scss'

</style>
<template>
  <div class="main-container user-group-list">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-left">
          <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除用户组</Button>
          <Button type="primary" icon="plus" @click="createData">创建用户组</Button>
        </div>
        <div class="float-right">
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="table-list">
        <div class="box-content">
          <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange">
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
    </div>
    <create-user-group ref="createUserGroup" @on-create-success="createSuccess"></create-user-group>
    <Modal title="移除用户组" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除用户组：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import axios from 'axios';
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getUserGroups, deleteUserGroup } from '../../models/service';
import paging from '../../components/page/paging';
import createUserGroup from '../../components/manage/create-user-group';

export default {
  name: 'userGroupList',
  components: {
    paging,
    createUserGroup,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      allDataList: [],
      searchName: '', //  搜索名称
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
      },
      total: 0,
      selectedData: [], // 选中数据
      deleteShowData: [],
      removeModal: false,
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '用户组名称',
          key: 'name',
          sortable: 'custom',
          width: 200,
          render: (h, params) => h('a', {
            attrs: {
              title: '查看用户组',
              // eslint-disable-next-line
              href: 'javascript:;',
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
        }, {
          title: '操作',
          align: 'right',
          width: 200,
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
                this.updateUserGroup(params.row);
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
  methods: {
    // 创建数据
    createData() {
      this.$refs.createUserGroup.createInit('create');
    },
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') {
          this.$Message.success('创建成功');
          this.getData(this.filter);
          this.viewDetail(data.user_group);
        } else if (msg === 'editgroup') {
          this.$Message.success('编辑成功');
          this.getData(this.filter);
        }
      }
    },
    // 修改用户组名,描述信息
    updateUserGroup(group) {
      this.$refs.createUserGroup.editInit(group, 'editgroup');
    },
    // 删除用户组
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
    // 移除用户组确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deleteUserGroup();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除成功
    deleteUserGroup() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deleteUserGroup({
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
    viewDetail(item) {
      localStorage.setItem('userGroupItem', JSON.stringify(item));
      this.$router.push({
        path: `/manage/user/group/detail/${item.id}/${this.filter.productId}`,
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
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
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.userGroupList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      getUserGroups(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.user_groups;
        }
      });
    },
  },
  computed: {
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
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
  },
  beforeDestroy() {},
};

</script>
