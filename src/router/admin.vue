<template>
  <layout :menus="adminMenu" :logo="logo" :logoMini="logoMini">
    <router-view slot="view"></router-view>
  </layout>
</template>

<script>
import { layout, adminMenu, logo, logoMini } from './config';

export default {
  components: {
    layout,
  },
  data() {
    return {
      adminMenu,
      logo,
      logoMini,
    };
  },
};
</script>
