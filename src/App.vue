<template>
  <div id="app" :class="{'bodyStyle' : isLogin}">
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: 'app',
  components: {
  },
  computed: {
    // 返回当前主路由
    routerNow() {
      return this.$route.path.split('/')[1];
    },
    isLogin() {
      return this.routerNow === 'login' || this.routerNow === 'index';
    },
  },
  watch: {
    routerNow(val) {
      if (val === 'product') {
        document.body.setAttribute('class', 'body-style-product');
      } else {
        document.body.removeAttribute('class');
      }
    },
  },
};
</script>
<style lang="scss">
  @import './styles/index.scss';
  @import './App.scss';
</style>

