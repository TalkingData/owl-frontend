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
      <Tabs :animated="false" :value="tabValue" @on-click="tabclick" class="tabs-fixed">
        <TabPane name="host" label="包含主机">
          <Row>
            <group-detail-host ref="groupDetailHost"></group-detail-host>
          </Row>
        </TabPane>
        <!-- <TabPane name="plugin" label="插件列表">
          <Row>
            <host-detail-plugin></host-detail-plugin>
          </Row>
        </TabPane> -->
        <TabPane name="rule" label="包含策略">
          <Row>
            <group-detail-strategy ref="strategy"></group-detail-strategy>
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
// import Util from '../../libs/utils';
import hostDetailPlugin from '../../components/monitor/host-detail-plugin';
import hostDetailMetric from '../../components/monitor/host-detail-metric';
import groupDetailHost from '../../components/monitor/group-detail-host';
import groupDetailStrategy from '../../components/monitor/group-detail-strategy';

export default {
  name: 'groupDetail',
  components: {
    hostDetailPlugin,
    hostDetailMetric,
    groupDetailHost,
    groupDetailStrategy,
  },
  props: {},
  data() {
    return {
      productId: '',
      stepsArr: [], // 告警详情步骤
      stepFlag: false, // 步骤一验证
      eventInfoList: [], // 获取详情信息
      groupItem: {}, // 从列表页获取的主机信息
      countIndex: 0, // 告警次数
      eventList: [], // 事件列表
      eventProcess: [], // 处理记录
      eventProcessStep: [], // 处理记录时间轴
      eventColumns: [{
        title: '时间',
        key: 'process_time',
      }, {
        title: '处理人',
        key: 'process_user',
      }, {
        title: '操作',
        key: 'process_comments',
      }],
      showResultModal: false,
      tabValue: 'host', // 切换tab
      // 主机组列表
      groupList: [{
        id: 1,
        name: 'cehsi1',
      }, {
        id: 2,
        name: 'cehsi2',
      }, {
        id: 3,
        name: 'cehsi3',
      }, {
        id: 4,
        name: 'cehsi3',
      }],
      groupSelected: '', // 选中组
      pluginList: [],
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/monitor/monitorgroup/${this.productId}`,
      });
    },
    // 查看告警结果
    showResult() {
      this.showResultModal = true;
    },
    // 设置详情信息
    getDetailData() {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      const groupItem = localStorage.getItem('groupItem');
      this.groupItem = JSON.parse(groupItem);
    },
    tabclick() {},
    // 点击组进行筛选
    getGroup() {
    },
    // 删除组
    removeGroup(index) {
      this.$Modal.confirm({
        title: '删除组',
        content: `确定要删除组：<a>${this.groupList[index].name}</a> 吗？`,
        onOk: () => {
          this.groupList.splice(index, 1);
        },
      });
    },
    // 添加组
    addGroup(arr) {
      const groupIds = arr.map(item => item.name);
      this.$Modal.confirm({
        title: '添加组',
        content: `确定要添加组 <a>${groupIds.toString()}</a> 到该主机吗？`,
        onOk: () => {
          arr.forEach((item) => {
            this.groupList.push(item);
          });
        },
      });
    },
  },
  computed: {
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
