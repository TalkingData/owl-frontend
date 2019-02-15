<style lang="scss">
  @import './monitor-host.scss';
</style>
<template>
  <div class="main-container monitor-host">
    <host-list source="monitor"></host-list>
  </div>
</template>
<script>
// import md5 from 'md5';
// import Cookies from 'js-cookie';
// import bus from '../../libs/bus';
import hostList from '../../components/monitor/host-list';

export default {
  name: 'monitorHost',
  components: {
    hostList,
  },
  props: {
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
