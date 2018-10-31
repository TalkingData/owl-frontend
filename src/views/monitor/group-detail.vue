<style lang="scss">
@import './group-detail.scss'

</style>
<template>
  <div class="main-container group-detail">
    <div class="common-detail-top common-detail-top-fixed clearfix">
      <div class="float-left">
        <span title="返回到主机组列表页" @click="backTo" class="common-detail-top-title">主机组列表&gt;</span>
        <span>&nbsp;主机组名称 : {{groupItem.name || '主机组详情'}}</span>
      </div>
    </div>
    <div class="common-detail-margin">
      <Tabs :animated="false" v-model="tabValue" @on-click="tabclick" class="tabs-fixed">
        <TabPane name="host" label="包含主机">
          <Row>
            <host-list source="group" ref="host"></host-list>
          </Row>
        </TabPane>
        <TabPane name="rule" label="包含策略">
          <Row class="tab-strategy-content">
            <group-detail-strategy ref="strategy"></group-detail-strategy>
          </Row>
        </TabPane>
        <TabPane name="plugin" label="插件列表">
          <Row>
            <plugin-list source="group" ref="plugin"></plugin-list>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  </div>
</template>
<script>
import pluginList from '../../components/admin/plugin/plugin-list';
import groupDetailStrategy from '../../components/monitor/group-detail-strategy';
import hostList from '../../components/monitor/host-list';

export default {
  name: 'groupDetail',
  components: {
    pluginList,
    groupDetailStrategy,
    hostList,
  },
  props: {},
  data() {
    return {
      productId: '',
      groupItem: {}, // 从列表页获取的主机信息
      tabValue: 'host', // 切换tab
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/monitor/group/${this.productId}`,
      });
    },
    // 设置详情信息
    getDetailData() {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      const groupItem = localStorage.getItem('groupItem');
      this.groupItem = JSON.parse(groupItem);
    },
    tabclick(name) {
      localStorage.setItem('group_detail_tab', name);
    },
  },
  computed: {
    groupId() {
      return parseInt(this.$route.params.groupId, 10);
    },
  },
  watch: {
    groupId() {
      this.getDetailData();
      this.$refs.host.getDetailData();
      this.$refs.strategy.getDetailData();
      this.$refs.plugin.getDetailData();
    },
  },
  created() {
    const tabName = localStorage.getItem('group_detail_tab');
    if (tabName) {
      this.tabValue = tabName;
    }
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
