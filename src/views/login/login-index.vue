<style lang="scss">
  @import './login-index.scss';
</style>
<template>
  <div class="login-index">
    <div class="login-box">
      <div class="logo"></div>
      <div v-if="!changepsd">
        <div class="notice">{{noticeLogin}}</div>
        <Form ref="userInfo" :model="userInfo">
          <Form-item prop="username" :rules="{ required: true, type: 'string', message: '用户名不能为空', trigger: 'change'}">
            <Input @on-keyup.enter="$refs.userpsd.focus()" v-model="userInfo.username" type="text" placeholder="用户名"></Input>
          </Form-item>
          <Form-item prop="userpsd" :rules="{ required: true, type: 'string', message: '密码不能为空', trigger: 'change'}">
            <Input ref="userpsd" @on-keyup.enter="verify()" v-model="userInfo.userpsd" type="password" placeholder="密码"></Input>
          </Form-item>
          <div class="submit">
            <Button type="primary" long @click="verify()">登录</Button>
              <!-- 后期开发 -->
           <!-- <div class="set">
              <Checkbox v-model="remember">记住我</Checkbox>
              <a @click="setpsd">修改密码?</a>
           </div> -->
          </div>
        </Form>
      </div>
      <div v-else>
        <div class="psd-notice">
          <p><b @click="setpsd">登录</b>>获取重设密码邮件</p>
        </div>
        <Form ref="rePsw" :model="rePsw">
          <div class="email">
            <p v-if="issend"><span class="icon-confirm"></span>重设密码邮件已发送</p>
            <!-- <p v-else style="color:#e96062">{{notice1}}</p> -->
          </div>
          <Form-item prop="emails" :rules="emailRules">
            <Input v-model="rePsw.emails" type="text" placeholder="输入正确的邮箱号"></Input>
          </Form-item>
          <div class="submit">
            <Button type="primary" long @click="verify()">重设密码</Button>
          </div>
        </Form>
      </div>
    </div>
    <div class="footer">
      TalkingData@2011~2018
    </div>
  </div>
</template>
<script>
import Cookies from 'js-cookie';
import md5 from 'md5';
import axios from 'axios';
import { getUserInfo } from '../../models/service';
import { serviceInfo } from '../../models/index';
import bus from '../../libs/bus';

export default {
  data() {
    return {
      changepsd: false,
      remember: false,
      noticeLogin: '', // 登陆提示信息
      notice1: '',
      emails: '',
      issend: false,
      // 登陆信息
      userInfo: {
        username: '',
        userpsd: '',
      },
      // 重置密码
      rePsw: {
        emails: '',
      },
      // 邮箱验证规则
      emailRules: {
        validator: bus.validateEmail,
        trigger: 'change',
      },
    };
  },
  components: {
  },
  mounted() {
  },
  created() {
  },
  beforeDestroy() {
  },
  methods: {
    setpsd() {
      this.issend = false;
      if (!this.changepsd) {
        this.changepsd = true;
      } else {
        this.changepsd = false;
      }
    },
    verify() {
      this.noticeLogin = '';
      this.issend = false;
      // 修改密码
      if (this.changepsd) {
        this.$refs.rePsw.validate((valid) => {
          if (valid) {
            this.issend = true;
            this.noticeLogin = '';
          }
        });
        // const reg = /^[a-zA-Z0-9]{1,10}@[a-zA-Z0-9]{1,5}\.[a-zA-Z0-9]{1,5}$/;
        // if (!reg.test(this.rePsw.emails)) {
        //   this.notice1 = '邮箱格式错误';
        // } else {
        //   this.issend = true;
        //   this.notice1 = '';
        // }
      } else {
        // 登陆
        this.$refs.userInfo.validate((valid) => {
          if (valid) {
            const tmp = new FormData();
            tmp.append('username', this.userInfo.username);
            tmp.append('password', md5(this.userInfo.userpsd));
            axios.post(`${serviceInfo.loginServer}/api/v1/login`, tmp, {
              headers: {
                Accept: 'application/json',
              },
            }).then((res) => {
              if (res.status === 200 && res.data.code === 307) {
                this.noticeLogin = '';
                axios.get(`${serviceInfo.loginServer}/api/v1/login?token=${res.data.token}`, {
                  withCredentials: true,
                }).then((resp) => {
                  if (resp.status === 200 && resp.data.code === 307) {
                    getUserInfo().then((response) => {
                      if (response.status === 200 && response.data.code === 200) {
                        Cookies.set('owl_role', md5(response.data.result.role), { expires: 1 });
                        this.$router.push({ path: '/product' });
                      } else {
                        this.noticeLogin = response.data.message;
                      }
                    });
                  } else {
                    this.noticeLogin = resp.data.message;
                  }
                });
              } else {
                this.noticeLogin = res.data.message;
              }
            }).catch((response) => {
              this.noticeLogin = response.data.message;
            });
          }
        });
      }
    },
  },
};

</script>
