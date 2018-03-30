<template>
  <layout :menus="menu" :logo="logo" :logoMini="logoMini">
    <router-view slot="view"></router-view>
  </layout>
</template>

<script>
import { layout, menu, logo, logoMini } from './config';

export default {
  components: {
    layout,
  },
  data() {
    return {
      menu,
      logo,
      logoMini,
    };
  },
};
</script>
