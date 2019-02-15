<style lang="scss">
@import './admin-user-list.scss';

</style>
<template>
  <div class="main-container">
    <div class="main-list-content">
      <div class="table-list admin-user-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="plus" type="primary" @click="addData">创建用户</Button>
          </div>
          <div class="float-right">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
        <div class="box-content">
          <paging ref="page" :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size">
            <Table size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              :loading="loading"
              no-data-text="暂无数据"
              @on-sort-change="handleSort"
              ></Table>
            <!-- @on-select-all="selectAll"
            @on-selection-change="selectItem" -->
          </paging>
        </div>
      </div>
    </div>
    <Modal title="修改角色" v-model="editModal">
      <Form :model="editInfo" :label-width="80">
        <FormItem label="名称">
          <span>{{editInfo.username}}</span>
        </FormItem>
        <FormItem label="角色">
          <Select v-model="editInfo.role">
            <Option v-for="(item, index) in roleList" 
            :key="index"
            :value="item.id"
            :label="item.name">
              {{item.name}}
            </Option>
          </Select>
        </FormItem>
      </Form>      
      <div slot="footer">
        <Button @click="editCancel">取消</Button>
        <Button @click="editConfirm" type="primary">确定</Button>
      </div>
    </Modal>
    <Modal title="修改用户信息" v-model="userInfoModal" @on-change="changeCancel">
      <Form :model="userInfo" ref="userUpdateInfo" :label-width="90" :rules="userInfoRules">
        <FormItem prop="username" label="用户名">
          <Input v-model="userInfo.username" readonly placeholder="请输入用户名"></Input>
        </FormItem>
        <FormItem prop="display_name" label="真实姓名" :rules="{required: true, type: 'string', trigger: 'change', message: '真实姓名不能为空'}">
          <Input v-model="userInfo.display_name" placeholder="请输入真实姓名"></Input>
        </FormItem>
        <FormItem class="un-required" prop="phone_number" label="手机号">
          <Input v-model="userInfo.phone_number" :maxlength="11" placeholder="请输入手机号"></Input>
        </FormItem>
        <FormItem class="un-required" prop="wechat" label="企业微信号">
          <Input v-model="userInfo.wechat" placeholder="请输入企业微信号"></Input>
        </FormItem>
      </Form>
      <div slot="footer" class="clearfix">
        <div class="common-float-right">
          <Button @click="changeCancel">取消</Button>
          <Button type="primary" @click="confirmUser">确认</Button>
        </div>
      </div>
    </Modal>
    <Modal title="创建用户" v-model="createModal" @on-cancel="createCancel">
      <Form :model="createInfo" ref="userCreateInfo" :label-width="90">
        <FormItem prop="username" label="用户名" :rules="{required: true, type: 'string', trigger: 'change', message: '用户名不能为空'}">
          <Input v-model="createInfo.username" placeholder="请输入用户名"></Input>
        </FormItem>
        <FormItem prop="email_address" label="邮箱" :rules="userInfoRules.email_address">
          <Input v-model="createInfo.email_address" placeholder="请输入邮箱"></Input>
        </FormItem>
        <FormItem prop="display_name" label="真实姓名" :rules="{required: true, type: 'string', trigger: 'change', message: '真实姓名不能为空'}">
          <Input v-model="createInfo.display_name" placeholder="请输入真实姓名"></Input>
        </FormItem>
        <FormItem label="角色" prop="role" :rules="{required: true, type: 'number', trigger: 'change', message: '请选择角色'}">
          <Select v-model="createInfo.role" transfer>
            <Option v-for="(item, index) in roleList" 
            :key="index"
            :value="item.id"
            :label="item.name">
              {{item.name}}
            </Option>
          </Select>
        </FormItem>
        <FormItem class="un-required" prop="phone_number" label="手机号" :rules="userInfoRules.phone_number">
          <Input v-model="createInfo.phone_number" :maxlength="11" placeholder="请输入手机号"></Input>
        </FormItem>
        <FormItem class="un-required" prop="wechat" label="企业微信号">
          <Input v-model="createInfo.wechat" placeholder="请输入企业微信号"></Input>
        </FormItem>
      </Form>
      <div slot="footer" class="clearfix">
        <div class="common-float-right">
          <Button @click="createCancel">取消</Button>
          <Button type="primary" @click="createUser">确认</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import core from '../../mixins/core';
import Util from '../../libs/utils';
import bus from '../../libs/bus';
import { getAllUsers, changeUserRole,
  updateUser, addUsers, deleteUsers, resetDefaultUser } from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'userGroupList',
  mixins: [core],
  components: {
    paging,
  },
  props: {},
  data() {
    return {
      loading: false,
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      alarmStatus: 0, // 全部默认
      filter: { // 翻页
        page: 1,
        page_size: 10,
      },
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      editModal: false,
      deleteShowData: [],
      editInfo: {},
      roleValue: 0,
      roleList: [{
        id: 0,
        name: '用户',
      }, {
        id: 1,
        name: '管理员',
      }],
      // 编辑用户信息
      userInfoModal: false,
      userInfo: {},
      userNameRules: [{
        validator: Util.validateName,
        trigger: 'change',
        required: true,
      }],
      userInfoRules: {
        phone_number: [{
          validator: Util.validatePhone,
          trigger: 'change',
          required: true,
        }],
        email_address: [{
          validator: Util.validateMail,
          trigger: 'change',
          required: true,
        }],
        // wechat: [{
        //   validator: Util.validateWechat,
        //   trigger: 'change',
        //   required: true,
        // }],
      },
      // 创建用户信息
      createInfo: {
        email_address: '',
        username: '',
        role: '',
        display_name: '',
        phone_number: '',
        wechat: '',
      },
      createModal: false,
      columns: [
        {
          title: '用户名称',
          key: 'username',
          sortable: 'custom',
          minWidth: 150,
        }, {
          title: '显示名称',
          key: 'display_name',
          sortable: 'custom',
          minWidth: 100,
        }, {
          title: '邮箱',
          key: 'email_address',
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
          key: 'phone_number',
          sortable: 'custom',
          width: 150,
        }, {
          title: '企业微信',
          key: 'wechat',
          sortable: 'custom',
          width: 150,
        }, {
          title: '操作',
          align: 'right',
          width: 150,
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: '修改权限',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'ios-people',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.editRole(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '编辑信息',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'edit',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.editUser(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '重置密码',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'key',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.resetPass(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '删除用户',
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
                this.deleteUser(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  methods: {
    // 创建用户
    addData() {
      this.createModal = true;
      this.createInfo = {
        email_address: '',
        username: '',
        role: '',
        display_name: '',
        phone_number: '',
        wechat: '',
      };
    },
    // 关闭创建
    createCancel() {
      this.createInfo = {
        email_address: '',
        username: '',
        role: '',
        display_name: '',
        phone_number: '',
        wechat: '',
      };
      this.$refs.userCreateInfo.resetFields();
      this.createModal = false;
    },
    createUser() {
      this.$refs.userCreateInfo.validate((valid) => {
        if (valid) {
          this.addUsers();
        }
      });
    },
    addUsers() {
      addUsers(this.createInfo).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          // this.createModal = false;
          this.createCancel();
          this.$Message.success('创建用户成功');
          this.getData(this.filter);
        } else {
          this.$Message.error({
            content: `创建失败：${res.data.message}`,
            duration: 3,
          });
        }
      });
    },
    // 编辑接口
    changeUserRole() {
      const params = {
        id: this.editInfo.id,
        role: this.editInfo.role,
      };
      changeUserRole(params).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.editModal = false;
          this.$Message.success('编辑成功');
        }
      });
    },
    // 修改用户信息
    updateUser() {
      updateUser({
        username: this.userInfo.username,
        display_name: this.userInfo.display_name,
        id: this.userInfo.id,
        phone_number: this.userInfo.phone_number,
        wechat: this.userInfo.wechat,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.initFilter();
          this.$Message.success('编辑成功');
        } else {
          this.$Mesaage.error('修改失败');
        }
      });
    },
    // 编辑用户
    editRole(obj) {
      if (obj) {
        this.editInfo = Object.assign({}, obj);
      }
      this.editModal = true;
    },
    // 编辑用户确认
    editConfirm() {
      this.editModal = false;
      this.changeUserRole();
    },
    // 取消编辑
    editCancel() {
      this.editModal = false;
      this.deleteShowData = [];
    },
    // 编辑用户信息
    editUser(obj) {
      this.userInfoModal = true;
      this.userInfo = Object.assign({}, obj);
    },
    // 重置密码
    resetPass(obj) {
      this.userInfo = Object.assign({}, obj);
      this.$Modal.confirm({
        title: '重置密码',
        content: `确定要将用户 ${this.userInfo.username} 的密码重置为默认密码?`,
        onOk: () => {
          this.resetDefaultUser();
        },
      });
    },
    // 删除用户
    deleteUser(obj) {
      this.userInfo = Object.assign({}, obj);
      this.$Modal.confirm({
        title: '删除用户',
        content: `确定要删除用户 ${this.userInfo.username} 吗?`,
        onOk: () => {
          this.deleteUserApi();
        },
      });
    },
    // 删除用户
    deleteUserApi() {
      deleteUsers({
        userId: this.userInfo.id,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.$Message.success('删除成功');
          this.initFilter();
        } else {
          this.$Message.error(`删除失败:${res.data.message}`);
        }
      });
    },
    // 重置默认密码
    resetDefaultUser() {
      resetDefaultUser(this.userInfo).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.$Message.success('重置成功');
          this.initFilter();
        } else {
          this.$Message.error(`重置失败:${res.data.message}`);
        }
      });
    },
    // 取消编辑
    changeCancel() {
      this.userInfoModal = false;
      this.$refs.userUpdateInfo.resetFields();
    },
    // 确认更新用户
    confirmUser() {
      this.$refs.userUpdateInfo.validate((valid) => {
        if (valid) {
          this.userInfoModal = false;
          this.updateUser();
        }
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
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
      // this.setInitPage(filter.pageSize);
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      let key = '';
      if (value.key === 'phone_number') {
        key = 'phone';
      } else if (value.key === 'email_address') {
        key = 'mail';
      } else {
        key = value.key;
      }
      const order = value.order === 'normal' ? '' : `${key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.loading = true;
      this.checkAll = false;
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      getAllUsers(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.users;
        } else {
          this.total = 0;
          this.dataList = [];
        }
        this.loading = false;
      });
    },
    // 用户角色展示
    getRoleStr(num) {
      return num === 1 ? '管理员' : '用户';
    },
  },
  computed: {
  },
  watch: {
  },
  created() {
  },
  mounted() {
    this.getData(this.filter);
    // 修改个人中心用户信息时,刷新该页面
    bus.$on('on-update-user', () => {
      this.reload();
    });
  },
  beforeDestroy() {
    bus.$off('on-update-user');
  },
};

</script>
