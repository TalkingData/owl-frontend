<style lang="scss">
  @import './plugin.scss'
</style>
<template>
  <div class="main-container plugin">
    <pluginList></pluginList>
  </div>
</template>
<script>
import pluginList from '../../components/plugin/plugin-list';

export default {
  name: 'plugin',
  components: {
    pluginList,
  },
  data() {
    return {
    };
  },
  methods: {
  },
  mounted() {
  },
};

</script>
