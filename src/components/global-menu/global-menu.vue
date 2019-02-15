<style lang="scss">
@import './global-menu.scss';

</style>
<template>
  <div :style="{background: bgColor}" class="ivu-shrinkable-menu">
    <slot name="top"></slot>
    <sidebar-menu v-show="!shrink" 
    :menu-theme="theme" 
    :menu-list="menuList" 
    :open-names="openNames" 
    @on-change="handleChange"
    @on-open-change="openMenu"
    ></sidebar-menu>
    <sidebar-menu-shrink v-show="shrink" 
    :menu-theme="theme" 
    :menu-list="menuList" 
    :icon-color="shrinkIconColor" 
    @on-change="handleChange"
    ></sidebar-menu-shrink>
  </div>
</template>
<script>
import sidebarMenu from './sidebar-menu';
import sidebarMenuShrink from './sidebar-menu-shrink';

function oneOf(ele, targetArr) {
  if (targetArr.indexOf(ele) >= 0) {
    return true;
  }
  return false;
}

export default {
  name: 'leftMenu',
  components: {
    sidebarMenu,
    sidebarMenuShrink,
  },
  props: {
    shrink: {
      type: Boolean,
      default: false,
    },
    menuList: {
      type: Array,
      required: true,
    },
    theme: {
      type: String,
      default: 'dark',
      validator(val) {
        return oneOf(val, ['dark', 'light']);
      },
    },
    beforePush: {
      type: Function,
    },
    openNames: {
      type: Array,
    },
  },
  computed: {
    bgColor() {
      return this.theme === 'dark' ? '#002140' : '#fff'; //  #495060
    },
    shrinkIconColor() {
      return this.theme === 'dark' ? '#fff' : '#495060';
    },
  },
  methods: {
    oneOf(ele, targetArr) {
      if (targetArr.indexOf(ele) >= 0) {
        return true;
      }
      return false;
    },
    handleChange(nameValue) {
      // 权限管理部分,配合后期角色值与router的to from等使用
      let willpush = true;
      if (this.beforePush !== undefined) {
        if (!this.beforePush(nameValue)) {
          willpush = false;
        }
      }
      // 默认该处生效
      if (willpush) {
        this.$router.push({
          name: nameValue,
        });
      }
      this.$emit('on-change', nameValue);
    },
    openMenu(arrs) {
      this.$emit('on-open-change', arrs);
    },
  },
};

</script>
