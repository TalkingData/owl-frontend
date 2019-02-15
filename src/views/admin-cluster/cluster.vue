<style lang="scss">
@import './cluster.scss';

</style>
<template>
  <div class="cluster main-container">
    <div class="common-detail-top common-detail-top-fixed clearfix">
      <div class="float-left">
        <span class="common-detail-top-title">集群状态</span>
      </div>
    </div>
    <div class="common-detail-margin">
      <Tabs :animated="false" v-model="tabValue" @on-click="tabclick" class="tabs-fixed">
        <TabPane name="queue" label="告警队列">
          <Row v-if="tabValue === 'queue'">
            <queue-list ref="queueList"></queue-list>
          </Row>
        </TabPane>
        <TabPane name="node" label="监控节点">
          <Row v-if="tabValue === 'node'">
            <node-list ref="nodeList"></node-list>
          </Row>
        </TabPane>
      </Tabs>
      <div class="common-detail-body">
      </div>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
// import bus from '../../libs/bus';
import queueList from '../../components/admin/cluster/queue-list';
import nodeList from '../../components/admin/cluster/node-list';

export default {
  name: 'productDetail',
  components: {
    queueList,
    nodeList,
  },
  props: {},
  data() {
    return {
      productItem: {}, // 从列表页获取的主机信息
      showResultModal: false,
      tabValue: 'queue', // 切换tab
    };
  },
  methods: {
    tabclick() {
    },
  },
  computed: {
  },
  mounted() {
  },
  beforeDestroy() {
  },
};

</script>
