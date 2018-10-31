<style lang="scss">
  @import './product.scss'
</style>
<template>
  <div class="product">
    <theader></theader>
    <div class="product-box">
      <ul class="product-list" v-if="isAdmin">
        <li class="product-item" @click="gotoAdmin">
          <a><Icon type="gear-b" class="mr-10"></Icon>进入管理员后台</a>
        </li>
      </ul>
      <ul class="product-list" v-if="productList.length > 0">
        <li class="product-item" v-for="(item, index) in productList" :key="index" @click="selectProduct(item)">
          {{item.name}}
        </li>
      </ul>
      <ul class="product-list" v-if="productList.length === 0 && !loading">
        <li class="product-item">
          <Alert type="warning" show-icon>你还没有产品线，请联系管理员</Alert>
        </li>
      </ul>
    </div>
    <div class="footer">
      TalkingData@2011~2018
    </div>
  </div>
</template>
<script>
import Cookies from 'js-cookie';
import md5 from 'md5';
import { getProducts, getUserInfo } from '../../models/service';
import bus from '../../libs/bus';
import theader from '../../components/header';

export default {
  data() {
    return {
      // 登陆信息
      userInfo: {
        username: '',
        userpsd: '',
      },
      addModal: false,
      // 添加产品线信息
      addProInfo: {
        name: '',
      },
      productList: [], // 产品线列表
      errorMsg: '', // 错误信息
      role: md5(1), // 1是管理员,0是普通用户
      isAdmin: false, // 判断是否是管理员
      loading: true, // 加载中
    };
  },
  computed: {
  },
  components: {
    theader,
  },
  mounted() {
    this.isAdmin = this.role === Cookies.get('owl_role');
    this.getProducts();
    // 触发角色校验
    bus.$on('on-role-info', (role) => {
      this.isAdmin = this.role === role;
    });
  },
  created() {
  },
  beforeDestroy() {
    bus.$off('on-role-info');
  },
  methods: {
    // 前往管理员页面
    gotoAdmin() {
      this.$router.push({
        path: '/admin/product/list',
      });
    },
    addData() {
      this.errorMsg = '';
      this.addModal = true;
      this.addProInfo.name = '';
    },
    // 获取产品线列表
    getProducts() {
      this.loading = true;
      getProducts().then((res) => {
        this.loading = false;
        if (res.status === 200 && res.data.code === 200) {
          this.productList = res.data.products;
        } else {
          this.productList = [];
        }
      });
    },
    // 选择产品线
    selectProduct(obj) {
      localStorage.setItem('productInfo', JSON.stringify(obj));
      this.$router.push({
        path: `/console/panel/list/${obj.id}`,
      });
    },
    getUser() {
      getUserInfo().then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          const arr = [];
          if (!res.data.result.phone_number) {
            arr.push('手机号');
          }
          if (!res.data.result.wechat) {
            arr.push('企业微信');
          }
          if (!res.data.result.display_name) {
            arr.push('真实姓名');
          }
          if (arr.length > 0) {
            this.$Notice.warning({
              title: '个人信息不完整',
              name: 'userNotice',
              duration: 0,
              render: h => h('div', {
                style: {
                  lineHeight: '20px',
                },
              }, [h('span', `您还有 ${arr.join('、')} 等项未设置，`), h('a', {
                attrs: {
                  title: '点击完善',
                  // eslint-disable-next-line
                  href: 'javascript:;',
                },
                on: {
                  click: () => {
                    this.$Notice.close('userNotice');
                    bus.$emit('on-user-change');
                  },
                },
              }, '前去完善')]),
            });
          }
        }
      });
    },
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      if (from.matched.length > 0 && (from.name === 'login_index'
        || from.name === 'login_timeout')) {
        // vm.$Message.warning('登录超时，请重新登录');
        vm.getUser();
      }
    });
  },
};

</script>
