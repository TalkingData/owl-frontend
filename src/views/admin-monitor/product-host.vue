<style lang="scss">
  @import './product-host.scss'
</style>
<template>
  <div class="main-container product-host-container">
    <host-list source="admin"></host-list>
  </div>
</template>
<script>
import hostList from '../../components/monitor/host-list';

export default {
  name: 'productHost',
  components: {
    hostList,
  },
  data() {
    return {
    };
  },
  computed: {
  },
  methods: {},
  mounted() {
  },
};

</script>
