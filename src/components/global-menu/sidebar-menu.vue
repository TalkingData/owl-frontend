<style lang="scss">
@import './global-menu.scss'

</style>
<template>
  <!-- 采用了menu中name作为菜单的name,因此一级导航菜单在设置中,需要与path保持一致 -->
  <i-menu ref="sideMenu" :active-name="activeName" :open-names="openNames" :theme="menuTheme" width="auto" @on-select="changeMenu">
    <template v-for="item in simpleList">
      <i-menu-item v-if="item.children.length <= 1" :name="item.children[0].name" :key="'imenuitem' + item.path">
        <Icon :type="item.icon" :size="iconSize"></Icon>
        <span class="layout-text">{{ itemTitle(item) }}</span>
      </i-menu-item>
      <Submenu v-if="item.children.length > 1" :name="item.name" :key="'subemenu' + item.path">
        <template slot="title">
          <Icon :type="item.icon" :size="iconSize"></Icon>
          <span class="layout-text">{{ itemTitle(item) }}</span>
        </template>
        <template v-for="child in item.children" v-if="!child.isSubPage">
          <i-menu-item :name="child.name" :key="'childmenuitem' + child.name">
          <Icon :type="child.icon" :size="iconSize" :key="'childicon' + child.name"></Icon>
          <span class="layout-text" :key="'chailspan' + child.name">{{ child.title }}</span>
          </i-menu-item>
        </template>
      </Submenu>
    </template>
  </i-menu>
</template>
<script>
import { Menu, MenuItem, Submenu, Icon } from 'iview';

export default {
  name: 'sidebarMenu',
  components: {
    iMenu: Menu,
    iMenuItem: MenuItem,
    Submenu,
    Icon,
  },
  props: {
    menuList: Array,
    iconSize: Number,
    menuTheme: {
      type: String,
      default: 'dark',
    },
    openNames: {
      type: Array,
    },
  },
  data() {
    return {};
  },
  methods: {
    changeMenu(active) {
      this.$emit('on-change', active);
    },
    itemTitle(item) {
      if (typeof item.title === 'object') {
        // return this.$t(item.title.i18n);
        return item.title.i18n;
      }
      return item.title;
    },
  },
  // 触发认证,默认打开二级菜单并选中正确选项
  updated() {
    this.$nextTick(() => {
      if (this.$refs.sideMenu) {
        this.$refs.sideMenu.updateOpened();
        this.$refs.sideMenu.updateActiveName();
      }
    });
  },
  computed: {
    simpleList: {
      get() {
        if (this.menuList.length > 0) {
          const arr = this.menuList.map((outer) => {
            const outerPage = JSON.parse(JSON.stringify(outer));
            outerPage.children = outerPage.children.filter(inner => !inner.isSubPage);
            return outerPage;
          });
          return arr;
        }
        return [];
      },
      set(newValue) {
        this.simpleList = newValue;
      },
    },
    // 当前路由name
    activeName: {
      get() {
        return this.subPageParent || this.$route.name;
      },
      set(newValue) {
        this.activeName = newValue;
      },
    },
    // 判断是否是次级页面,如果是,返回父级页面name,否则返回空
    subPageParent() {
      const routeName = this.$route.name;
      let name = '';
      if (this.menuList.length > 0) {
        for (let i = 0; i < this.menuList.length; i += 1) {
          const temp = this.menuList[i];
          const child = temp.children.find(n => n.name === routeName);
          if (child) {
            // 获取到name对应的路由，判断是否是subPage，是的话，返回父级，不是返回自己
            name = child.isSubPage ? child.parentPage : child.name;
            return name;
          }
        }
        return name;
      }
      return '';
    },
  },
  mounted() {
  },
};

</script>
