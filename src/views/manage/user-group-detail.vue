<style lang="scss">
@import './user-group-detail.scss'

</style>
<template>
  <div class="main-container user-group-detail">
    <div class="main-list-content">
      <div class="common-detail-top clearfix">
        <div class="float-left">
          <span title="返回到用户组列表页" @click="backTo" class="common-detail-top-title">用户组列表&gt;</span>
          <span>&nbsp;用户组名称 : {{userGroupItem.name || '--'}}</span>
        </div>
        <div class="float-right" v-if="userGroupItem.description">
          <span>用户组描述 : {{userGroupItem.description}}</span>
        </div>
      </div>
      <div class="table-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">移除用户</Button>
            <Button type="primary" icon="plus" @click="createData">添加用户</Button>
          </div>
          <div class="float-right">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
        <div class="box-content">
          <div class="box-content-title">
            <Row>
              <Col class="title-th" span="6">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>用户名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="username"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="6">邮箱
              <sort-page 
                :sort-value="filter.order" 
                sort-name="mail"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">角色
              <sort-page 
                :sort-value="filter.order" 
                sort-name="role"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">手机
              <sort-page 
                :sort-value="filter.order" 
                sort-name="phone"
                @on-sort-change="handleSort"></sort-page></Col>
            </Row>
          </div>
          <paging ref="userList" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index" @click.native="selectItem(item, index)">
                <!-- @click.native.stop="selectItem(item, index)" -->
                <Col class="body-td hidden-td" span="6">
                <Checkbox v-model="item.checked" ></Checkbox>
                <span :title="item.username">{{item.username || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="6" :title="item.mail">{{item.mail || '--'}}</Col>
                <Col class="body-td" span="4">
                  {{getRoleStr(item.role)}}
                </Col>
                <Col class="body-td" span="4">
                  {{item.phone || '--'}}
                </Col>
                <Col class="body-td" span="4">
                  <div class="float-right pr-20">
                    <Tooltip content="移除" placement="top" class="ml-10">
                      <Icon size="18" type="ios-minus-outline" @click.native.stop="removeData(item)"></Icon>
                    </Tooltip>
                  </div>
                </Col>
              </Row>
            </div>
            <div slot="listTable" class="box-content-body" v-else>
              <Row style="text-align: center" class="box-content-item">暂无数据</Row>
            </div>
          </paging>
        </div>
      </div>
    </div>
    <create-user-group ref="createUserGroup" @on-create-success="createSuccess"></create-user-group>
    <Modal title="移除用户" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除用户：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.username}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getUserOfGroup, removeUserInGroup } from '../../models/service';
import paging from '../../components/page/paging';
import createUserGroup from '../../components/manage/create-user-group';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'userList',
  components: {
    paging,
    createUserGroup,
    sortPage,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
      },
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      groupId: 0,
      userGroupItem: {}, // 用户组信息
      removeModal: false, // 删除弹出
      deleteShowData: [],
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/manage/usergroup/${this.$route.params.productId}`,
      });
    },
    // 全选
    selectAll(flag) {
      if (flag) {
        this.selectedData = this.dataList.map((item) => {
          const obj = item;
          obj.checked = true;
          return obj;
        });
      } else {
        this.selectedData = [];
        this.dataList.map((item) => {
          const obj = item;
          obj.checked = false;
          return obj;
        });
      }
    },
    // 单选
    selectItem(item, index) {
      this.dataList[index].checked = !this.dataList[index].checked;
      this.selectedData = this.dataList.filter(plugin => plugin.checked);
      this.checkAll = this.selectedData.length === this.dataList.length;
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    reload() {
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
      this.filter.order = value;
      this.initFilter();
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.userList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.checkAll = false;
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      getUserOfGroup(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.users.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
    // 初始化获取数据
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      this.groupId = parseInt(this.$route.params.usergroupId, 10); // 用户组id
      const str = localStorage.getItem('userGroupItem');
      const userGroupItem = JSON.parse(str);
      this.userGroupItem = userGroupItem;
      this.filter.groupId = this.groupId;
      this.getData(this.filter);
    },
    // 操作--------------------------------------------------------
    // 创建数据
    createData() {
      this.$refs.createUserGroup.editInit(this.userGroupItem, 'addgroupuser');
    },
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        this.$Message.success('添加成功');
        this.initFilter();
      }
    },
    // 移除用户
    removeData(obj) {
      if (obj === 'multiple') { // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const user = Object.assign({}, item);
          return user;
        });
      } else { // 移除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 删除用户确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.removeUserInGroup();
      }
    },
    // 删除成功
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
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
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
        };
      }
      return {
        isRemove: false,
      };
    },
    // 路径
    path() {
      return this.$route.path;
    },
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {},
};

</script>
