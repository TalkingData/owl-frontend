<style lang="scss">
@import './host-plugin.scss'

</style>
<template>
  <div class="main-container host-plugin">
    <div class="main-list-content">
      <div class="common-detail-top common-detail-top-fixed">
        <Row class="common-detail-top-item">
          <div class="float-left">
            <span title="返回到上级页面" @click="backTo" class="common-detail-top-title">返回上级&gt;</span>
            <span>&nbsp;主机名称 : {{hostItemInfo.hostname || '主机插件'}}</span>
          </div>
        </Row>
      </div>
    </div>
    <plugin-list source="host"></plugin-list>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
import pluginList from '../../components/admin/plugin/plugin-list';

export default {
  name: 'hostPlugin',
  components: {
    pluginList,
  },
  props: {},
  data() {
    return {
      hostId: '',
      hostItemInfo: {}, // 主机信息
    };
  },
  methods: {
    backTo() {
      this.$router.go(-1);
    },
    // 初始化获取数据
    getDetailData() {
      this.hostId = this.$route.params.hostId; // 主机id
      const str = localStorage.getItem('hostItemInfo');
      const hostItemInfo = JSON.parse(str);
      this.hostItemInfo = hostItemInfo;
    },
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
