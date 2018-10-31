<style lang="scss">
@import "./index.scss"
</style>
<template>
  <div class="main-header">
    <div class="float-left" v-if="isProduct">
      <div class="logo-con">
        <img src="../../assets/logo.jpg" key="max-logo"/>
      </div>
    </div>
    <div class="navicon-con" v-else>
      <i-button :style="{transform: 'rotateZ(' + (shrink ? '-90' : '0') + 'deg)'}" type="text" @click="toggleClick">
        <Icon type="navicon" size="32"></Icon>
      </i-button>
    </div>
    <div class="bread-con">
      <Row type="flex" justify="end" align="middle">
        <Breadcrumb v-if="subPageParent.length > 0">
          <BreadcrumbItem v-if="titleRole">{{titleRole}}</BreadcrumbItem>
          <BreadcrumbItem v-for="(item, index) in subPageParent" :key="index" @click.native="gotoPage(item, index)">{{item.title}}</BreadcrumbItem>
        </Breadcrumb>
      </Row>
    </div>
    <div class="personal-center float-right mr-18">
      <Row type="flex" justify="end" align="middle">
        <Dropdown style="margin-left: 20px" @on-click="userSet" placement="bottom-end">
          <a href="javascript:;">
            个人中心
            <Icon type="arrow-down-b"></Icon>
          </a>
          <DropdownMenu slot="list">
            <DropdownItem v-if="!isProduct" name="product">返回产品列表</DropdownItem>
            <DropdownItem name="person">个人信息</DropdownItem>
            <DropdownItem name="resetpsw">修改密码</DropdownItem>
            <DropdownItem name="logout">退出登录</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </Row>
    </div>
    <Modal :title="modalTitle" v-model="userInfoModal">
      <Form v-if="!isResetPwd" :model="userInfo" ref="userUpdateInfo" :label-width="90" :rules="userInfoRules">
        <FormItem prop="username" label="用户名">
          <Input v-model="userInfo.username" disabled placeholder="请输入用户名"></Input>
        </FormItem>
        <FormItem prop="display_name" label="真实姓名" :rules="{required: true, type: 'string', trigger: 'change', message: '真实姓名不能为空'}">
          <Input v-model="userInfo.display_name" placeholder="请输入真实姓名"></Input>
        </FormItem>
        <FormItem prop="phone_number" label="手机号">
          <Input v-model="userInfo.phone_number" :maxlength="11" placeholder="请输入手机号"></Input>
        </FormItem>
        <!-- <FormItem prop="email_address" label="邮箱">
          <Input v-model="userInfo.email_address" placeholder="请输入邮箱"></Input>
        </FormItem> -->
        <FormItem prop="wechat" label="企业微信号">
          <Input v-model="userInfo.wechat" placeholder="请输入企业微信号"></Input>
        </FormItem>
      </Form>
      <Row v-if="isResetPwd">
        <div v-if="messageSuccess">
          <Alert type="success" show-icon>{{messageSuccess}}，{{timeInterval}}s</Alert>
        </div>
        <Form :model="resetInfo" ref="resetForm" :label-width="80">
          <FormItem label="用户名">
            <Input v-model="userInfo.username" disabled placeholder="请输入用户名"></Input>
          </FormItem>
          <FormItem prop="oldpwd" label="原始密码" :rules="resetRules.oldpwd">
            <Input ref="oldpwd" v-model="resetInfo.oldpwd" type="password" autocomplete="off" placeholder="请输入原始密码"></Input>
          </FormItem>
          <FormItem prop="newpwd" label="新密码" :rules="resetRules.newpwd">
            <Input v-model="resetInfo.newpwd" autocomplete="off" type="password" placeholder="请输入新密码"></Input>
          </FormItem>
          <FormItem prop="confirmpwd" label="确认密码" :rules="resetRules.confirmpwd">
            <Input v-model="resetInfo.confirmpwd" autocomplete="off" type="password" placeholder="请再次输入密码"></Input>
          </FormItem>
        </Form>
      </Row>
      <div slot="footer" class="clearfix">
        <div class="common-float-left">
          <!-- <Button @click="resetPwd">{{resetWord}}</Button> -->
        </div>
        <div class="common-float-right">
          <Button @click="cancelUser">取消</Button>
          <Button type="primary" @click="confirmUser">确认</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
import axios from 'axios';
import Cookies from 'js-cookie';
import md5 from 'md5';
import { Icon, Button, Badge, Row, Dropdown, DropdownMenu, DropdownItem } from 'iview';
import bus from '../../libs/bus';
import Util from '../../libs/utils';
import { updateUser, getUserInfo } from '../../models/service';
import { serviceInfo } from '../../models/index';

export default {
  name: 'tHeader',
  components: {
    Icon,
    iButton: Button,
    Badge,
    Row,
    Dropdown,
    DropdownMenu,
    DropdownItem,
  },
  props: {
    // 缩进
    shrink: {
      type: Boolean,
      default: false,
    },
    menuList: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      oldType: 'text',
      productList: [], // 产品线列表
      md: md5(1),
      role: '',
      tabValue: 'chart',
      // userName: 'ceshi',
      userInfoModal: false,
      userInfo: {},
      resetInfo: {
        oldpwd: '',
        newpwd: '',
        confirmpwd: '',
      },
      isResetPwd: false,
      userInfoRules: {
        phone_number: [{
          validator: Util.validatePhone,
          trigger: 'change',
          // required: true,
        }],
        email_address: [{
          validator: Util.validateMail,
          trigger: 'change',
          required: true,
        }],
        // wechat: [{
        //   validator: Util.validateWechat,
        //   trigger: 'change',
        // }],
      },
      resetRules: {
        oldpwd: [{
          validator: Util.validateOldPsd,
          trigger: 'change',
          required: true,
        }],
        newpwd: [{
          validator: Util.validateNewPsd,
          trigger: 'change',
          required: true,
        }],
        confirmpwd: [{
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入确认密码'));
            } else if (value !== this.resetInfo.newpwd) {
              callback(new Error('两次输入密码不一致!'));
            } else {
              callback();
            }
          },
          trigger: 'change',
          required: true,
        }],
      },
      titleProduct: '',
      timeInterval: 3, // 倒计时
      messageSuccess: '', // 修改密码成功信息
    };
  },
  methods: {
    // 面包屑跳转到对应页面,一般用于详情页返回列表页
    gotoPage(obj, index) {
      if (index === 1) {
        this.$router.push({
          name: obj.name,
        });
      }
    },
    // 返回产品页
    gotoProduct() {
      this.$router.push({
        path: '/product',
      });
    },
    // 切换缩进
    toggleClick() {
      const shrink = !this.shrink;
      this.$emit('on-toggle', shrink);
    },
    // 用户信息展示
    showUserInfo() {
      this.getUserInfo();
      this.isResetPwd = false;
      this.userInfoModal = true;
    },
    // 用户信息与退出
    userSet(name) {
      if (name === 'person') {
        this.showUserInfo();
      } else if (name === 'logout') {
        this.logoutModal();
      } else if (name === 'product') {
        this.gotoProduct();
      } else if (name === 'resetpsw') {
        this.resetPwd();
      }
    },
    // 重置密码
    resetPwd() {
      this.messageSuccess = '';
      this.getUserInfo();
      this.isResetPwd = true;
      this.userInfoModal = true;
      // this.isResetPwd = !this.isResetPwd;
    },
    // 确认
    confirmUser() {
      if (this.isResetPwd) {
        this.$refs.resetForm.validate((valid) => {
          if (valid) {
            this.messageSuccess = '';
            // this.userInfoModal = false;
            this.resetPassword();
          }
        });
      } else {
        this.$refs.userUpdateInfo.validate((valid) => {
          if (valid) {
            this.userInfoModal = false;
            this.updateUser();
          }
        });
      }
    },
    cancelUser() {
      this.userInfoModal = false;
      if (this.isResetPwd) {
        this.$refs.resetForm.resetFields();
      } else {
        this.$refs.userUpdateInfo.resetFields();
      }
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
          this.$Message.success('修改成功');
          this.getUserInfo();
          // 修改个人中心用户信息时,刷新用户管理页面
          bus.$emit('on-update-user');
        } else {
          this.$Message.error('修改失败');
        }
      });
    },
    // 获取用户信息
    getUserInfo() {
      getUserInfo().then((response) => {
        if (response.status === 200 && response.data.code === 200) {
          this.userInfo = response.data.result;
          this.role = md5(response.data.result.role);
          Cookies.set('owl_role', md5(response.data.result.role), { expires: 1 });
          // 触发角色校验
          bus.$emit('on-role-info', this.role);
        }
      });
    },
    // 重置密码
    resetPassword() {
      const tmp = new FormData();
      tmp.append('username', this.userInfo.username);
      tmp.append('password', md5(this.resetInfo.oldpwd));
      tmp.append('new_password', md5(this.resetInfo.newpwd));
      axios.post(`${serviceInfo.loginServer}/api/v1/users/changepassword`, tmp, {
        headers: {
          Accept: 'application/json',
        },
        withCredentials: true,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.timeInterval = 3;
          const countTime = setInterval(() => {
            this.timeInterval = this.timeInterval - 1;
          }, 1000);
          this.messageSuccess = '修改密码成功，即将退出重新登陆';
          this.$Message.success('修改密码成功');
          setTimeout(() => {
            this.messageSuccess = '';
            this.userInfoModal = false;
            clearInterval(countTime);
            this.logout();
          }, 3000);
        } else {
          this.messageSuccess = '';
          this.$Message.error(res.data.message);
        }
      });
    },
    // 退出登录确认
    logoutModal() {
      this.$Modal.confirm({
        title: '退出登录',
        content: '确定要退出登录吗？',
        onOk: () => {
          this.logout();
        },
      });
    },
    // 退出登录
    logout() {
      axios.post(`${serviceInfo.loginServer}/api/v1/logout`, {}, {
        withCredentials: true,
      }).then((res) => {
        if (res.status === 200) {
          Cookies.remove('owl_role');
          // 退出成功后调用任意接口,进行login的跳转
          getUserInfo();
        }
      });
    },
  },
  mounted() {
    // 修改个人信息
    bus.$on('on-user-change', () => {
      this.showUserInfo();
    });
    this.getUserInfo();
    // 获取面包屑首位
    const infoStr = localStorage.getItem('productInfo');
    if (infoStr) {
      const info = JSON.parse(infoStr);
      if (info) {
        this.titleProduct = info.name;
      }
    }
  },
  beforeDestory() {
    bus.$off('on-user-change');
  },
  computed: {
    titleRole() {
      return this.routerNow.indexOf('admin') > -1 ? '管理员后台' : this.titleProduct;
    },
    // 返回当前主路由
    routerNow() {
      return this.$route.path.split('/')[1];
    },
    // 返回是否是产品页
    isProduct() {
      return this.$route.path.split('/')[1] === 'product';
    },
    resetWord() {
      const str = this.isResetPwd ? '用户设置' : '修改密码';
      return str;
    },
    modalTitle() {
      const str = this.isResetPwd ? '修改密码' : '用户设置';
      return str;
    },
    // 判断是否是二级页面,普通页面,返回单数组,二级页面返回三数组
    subPageParent() {
      // 获取当前页
      const routeName = this.$route.name;
      if (this.menuList.length > 0) {
        // 循环找到外层路由
        for (let i = 0; i < this.menuList.length; i += 1) {
          const temp = this.menuList[i];
          // 获取最后一项,last存在时，找到最外层和最内层
          const last = temp.children.find(n => n.name === routeName);
          if (last) {
            // 获取第一项
            const first = temp;
            // 获取到name对应的路由，判断是否是subPage，是的话，找到父级，不是返回自己
            if (last.isSubPage) {
              const middle = temp.children.find(n => n.name === last.parentPage);
              if (middle) return [first, middle, last];
              return [first, last];
            }
            return [first, last];
          }
        }
        return [];
      }
      return [];
    },
    oldInputType() {
      if (this.resetInfo.oldpwd) {
        return 'password';
      }
      return 'text';
    },
    newpwdInput() {
      if (this.resetInfo.newpwd) {
        return 'password';
      }
      return 'text';
    },
    confirmpwdInput() {
      if (this.resetInfo.confirmpwd) {
        return 'password';
      }
      return 'text';
    },
  },
  watch: {
  },
};
</script>
