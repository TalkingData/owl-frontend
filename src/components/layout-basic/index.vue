<style lang="scss">
@import "./index.scss"
</style>

<template>
  <div class="main" :class="{'main-hide-text': shrink}">
    <div class="sidebar-menu-con" :style="{width: shrink?'60px':'200px', overflow: shrink ? 'visible' : 'auto'}">
      <global-menu
        :shrink="shrink"
        @on-change="handleSubmenuChange"
        @on-open-change="openMenu"
        :theme="menuTheme"
        :before-push="beforePush"
        :open-names="openedSubmenuArr"
        :menu-list="menuList">
        <div slot="top" class="logo-con" :style="{width: shrink?'60px':'200px'}" @click="gotoProduct" title="返回产品页">
          <img v-show="!shrink" :src="logo" key="max-logo" />
          <img v-show="shrink" :src="logoMini" key="min-logo" />
        </div>
      </global-menu>
    </div>
    <div class="main-header-con" :style="{paddingLeft: shrink?'60px':'200px'}">
      <theader
      :shrink="shrink"
      :menu-list="menus"
      @on-toggle="toggleClick"></theader>
    </div>
    <div class="single-page-con" :style="{left: shrink?'60px':'200px'}" :class="[shrink ? 'shrinked' : 'unshrinked']">
      <div class="single-page">
        <slot name="view"></slot>
      </div>
    </div>
    <!-- <tfooter :style="{paddingLeft: shrink?'60px':'200px'}"></tfooter> -->
  </div>
</template>
<script>
import { Button, Icon } from 'iview';
import globalMenu from '../global-menu/global-menu';
// import tfooter from '../global-footer';
import theader from '../header';
import bus from '../../libs/bus';

export default {
  components: {
    iButton: Button,
    Icon,
    globalMenu,
    // tfooter,
    theader,
  },
  props: {
    logo: {
      type: String,
      required: true,
    },
    logoMini: {
      type: String,
      required: true,
    },
    menus: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      shrink: false, // 左侧栏宽窄控制
      userName: '',
      isFullScreen: false,
      // openedSubmenuArr: [], // 要展开的菜单数组
      menuTheme: 'light',
      menuList: [],
      language: 'EN',
      languageList: ['EN', 'CN'], // 语言列表
      // 个人中心
      personalList: [{
        label: '个人中心',
        name: 'ownSpace',
      }, {
        label: '退出登录',
        name: 'loginout',
      }],
    };
  },
  computed: {
    // 要展开的菜单数组新方式,一级菜单name和path可以不一致,但name必须唯一
    openedSubmenuArr: {
      get() {
        const routeName = this.$route.name;
        // 将展开的次级菜单加入到展开数组内
        const menuStr = localStorage.getItem('menuArray');
        let arr = [];
        if (menuStr) {
          arr = JSON.parse(menuStr);
        }
        if (this.menus.length > 0) {
          for (let i = 0; i < this.menus.length; i += 1) {
            const temp = this.menus[i];
            const child = temp.children.find(n => n.name === routeName);
            if (child && arr.indexOf(temp.name) === -1) {
              arr.push(temp.name);
              return arr;
            }
          }
          return arr;
        }
        return [];
      },
      set(newValue) {
        this.openedSubmenuArr = newValue;
      },
    },
  },
  methods: {
    // 返回产品页
    gotoProduct() {
      this.$router.push({
        path: '/product',
      });
    },
    // 展开与关闭左侧栏
    toggleClick(value) {
      // this.shrink = !this.shrink;
      this.shrink = value;
      setTimeout(() => {
        bus.$emit('on-shrink-change');
      }, 400);
    },
    // 路由切换
    handleSubmenuChange() {
    },
    // 打开关闭次级菜单
    openMenu(arrs) {
      localStorage.setItem('menuArray', JSON.stringify(arrs));
    },
    // eslint-disable-next-line
    beforePush(name) { // 权限校验,暂时全部通过
      // if (name === 'accesstest_index') {
      //     return false;
      // } else {
      //     return true;
      // }
      return true;
    },
    // 查看用户信息
    showUserInfo() {},
    // 展示通知
    showNotice() {
    },
    // 修改语言
    changeLanguage(value) {
      this.language = value;
    },
  },
  watch: {
  },
  mounted() {
    this.menuList = this.menus;
  },
  created() {
  },
};
</script>
