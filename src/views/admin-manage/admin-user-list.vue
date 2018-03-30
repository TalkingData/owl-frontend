<style lang="scss">
@import './admin-user-list.scss'

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
          <div class="box-content-title">
            <Row>
              <Col class="title-th" span="4">
              <!-- <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox> -->
              用户名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="username"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="3">显示名称
                <sort-page 
                :sort-value="filter.order" 
                sort-name="display_name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="2">角色
              <sort-page 
                :sort-value="filter.order" 
                sort-name="role"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">手机
              <sort-page 
                :sort-value="filter.order" 
                sort-name="phone"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">微信
              <sort-page 
                :sort-value="filter.order" 
                sort-name="wechat"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">邮箱
              <sort-page 
                :sort-value="filter.order" 
                sort-name="mail"
                @on-sort-change="handleSort"></sort-page></Col>
            </Row>
          </div>
          <paging ref="page" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index" @click.native="selectItem(item, index)">
                <!-- @click.native.stop="selectItem(item, index)" -->
                <Col class="body-td hidden-td" span="4">
                <!-- <Checkbox v-model="item.checked" ></Checkbox> -->
                <span :title="item.username">{{item.username || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="3" :title="item.display_name">{{item.display_name || '--'}}</Col>
                <Col class="body-td" span="2">
                  {{getRoleStr(item.role)}}
                </Col>
                <Col class="body-td" span="4">
                  {{item.phone_number || '--'}}
                </Col>
                <Col class="body-td" span="4">
                  {{item.wechat || '--'}}
                </Col>
                <Col class="body-td hidden-td" span="4">
                <span :title="item.email_address">{{item.email_address || '--'}}</span>
                </Col>
                <Col class="body-td" span="3">
                <div class="float-right pr-20">
                  <Tooltip content="修改权限" placement="top" class="ml-10">
                    <Icon size="18" type="ios-people" @click.native.stop="editRole(item)"></Icon>
                  </Tooltip>
                  <Tooltip content="编辑信息" placement="top" class="ml-10">
                    <Icon size="18" type="edit" @click.native.stop="editUser(item)"></Icon>
                  </Tooltip>
                  <Tooltip content="重置密码" placement="top" class="ml-10">
                    <Icon size="18" type="key" @click.native.stop="resetPass(item)"></Icon>
                  </Tooltip>
                  <Tooltip content="删除用户" placement="top" class="ml-10">
                    <Icon size="18" type="trash-a" @click.native.stop="deleteUser(item)"></Icon>
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
    <Modal title="修改角色" v-model="editModal">
      <Form :model="editInfo" :label-width="80">
        <Form-item label="名称">
          <span>{{editInfo.username}}</span>
        </Form-item>
        <Form-item label="角色">
          <Select v-model="editInfo.role">
            <Option v-for="(item, index) in roleList" 
            :key="index"
            :value="item.id"
            :label="item.name">
              {{item.name}}
            </Option>
          </Select>
        </Form-item>
      </Form>      
      <div slot="footer">
        <Button @click="editConfirm" type="primary">确定</Button>
        <Button @click="editCancel">取消</Button>
      </div>
    </Modal>
    <Modal title="修改用户信息" v-model="userInfoModal">
      <Form :model="userInfo" ref="userUpdateInfo" :label-width="80" :rules="userInfoRules">
        <Form-item prop="username" label="用户名">
          <Input v-model="userInfo.username" disabled placeholder="请输入用户名"></Input>
        </Form-item>
        <Form-item prop="display_name" label="真实姓名" :rules="{required: true, type: 'string', trigger: 'change', message: '真实姓名不能为空'}">
          <Input v-model="userInfo.display_name" placeholder="请输入真实姓名"></Input>
        </Form-item>
        <Form-item class="un-required" prop="phone_number" label="手机号">
          <Input v-model="userInfo.phone_number" :maxlength="11" placeholder="请输入手机号"></Input>
        </Form-item>
        <Form-item class="un-required" prop="wechat" label="微信号">
          <Input v-model="userInfo.wechat" placeholder="请输入微信号"></Input>
        </Form-item>
      </Form>
      <div slot="footer" class="clearfix">
        <div class="common-float-right">
          <Button @click="userInfoModal = false">取消</Button>
          <Button type="primary" @click="confirmUser">确认</Button>
        </div>
      </div>
    </Modal>
    <Modal title="创建用户" v-model="createModal">
      <Form :model="createInfo" ref="userCreateInfo" :label-width="80">
        <Form-item prop="username" label="用户名" :rules="{required: true, type: 'string', trigger: 'change', message: '用户名不能为空'}">
          <Input v-model="createInfo.username" placeholder="请输入用户名"></Input>
        </Form-item>
        <Form-item prop="email_address" label="邮箱" :rules="userInfoRules.email_address">
          <Input v-model="createInfo.email_address" placeholder="请输入邮箱"></Input>
        </Form-item>
        <Form-item prop="display_name" label="真实姓名" :rules="{required: true, type: 'string', trigger: 'change', message: '真实姓名不能为空'}">
          <Input v-model="createInfo.display_name" placeholder="请输入真实姓名"></Input>
        </Form-item>
        <Form-item label="角色" prop="role" :rules="{required: true, type: 'number', trigger: 'change', message: '请选择角色'}">
          <Select v-model="createInfo.role" transfer>
            <Option v-for="(item, index) in roleList" 
            :key="index"
            :value="item.id"
            :label="item.name">
              {{item.name}}
            </Option>
          </Select>
        </Form-item>
        <Form-item class="un-required" prop="phone_number" label="手机号" :rules="userInfoRules.phone_number">
          <Input v-model="createInfo.phone_number" :maxlength="11" placeholder="请输入手机号"></Input>
        </Form-item>
        <Form-item class="un-required" prop="wechat" label="微信号" :rules="userInfoRules.wechat">
          <Input v-model="createInfo.wechat" placeholder="请输入微信号"></Input>
        </Form-item>
      </Form>
      <div slot="footer" class="clearfix">
        <div class="common-float-right">
          <Button @click="createModal = false">取消</Button>
          <Button type="primary" @click="createUser">确认</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getAllUsers, changeUserRole,
  updateUser, addUsers, deleteUsers, resetDefaultUser } from '../../models/service';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'userGroupList',
  components: {
    paging,
    sortPage,
  },
  props: {},
  data() {
    const phoneReg = /^1(3|4|5|7|8)\d{9}$/;
    // eslint-disable-next-line
    const emailReg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    const wechatReg = /^[a-zA-Z0-9]{1}([-_a-zA-Z0-9]{5,19})+$/;
    return {
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
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error('请输入用户名'));
          } else if (!wechatReg.test(value)) {
            callback(new Error('用户名格式不正确'));
          } else {
            callback();
          }
        },
        trigger: 'change',
        required: true,
      }],
      userInfoRules: {
        phone_number: [{
          validator: (rule, value, callback) => {
            if (!value) {
              // callback(new Error('请输入手机号'));
              callback();
            } else if (!phoneReg.test(value)) {
              callback(new Error('手机号格式不正确'));
            } else {
              callback();
            }
          },
          trigger: 'change',
          required: true,
        }],
        email_address: [{
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入邮箱'));
            } else if (!emailReg.test(value)) {
              callback(new Error('邮箱格式不正确'));
            } else {
              callback();
            }
          },
          trigger: 'change',
          required: true,
        }],
        wechat: [{
          validator: (rule, value, callback) => {
            if (!value) {
              // callback(new Error('请输微信号'));
              callback();
            } else if (!wechatReg.test(value)) {
              callback(new Error('微信号格式不正确'));
            } else {
              callback();
            }
          },
          trigger: 'change',
          required: true,
        }],
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
          this.createModal = false;
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
      this.$refs.page.init();
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
      getAllUsers(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.users;
        }
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
  mounted() {
    this.getData(this.filter);
  },
  beforeDestroy() {},
};

</script>
