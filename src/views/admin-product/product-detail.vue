<style lang="scss">
@import './product-detail.scss'

</style>
<template>
  <div class="product-detail main-container">
    <div class="common-detail-top common-detail-top-fixed clearfix">
      <div class="float-left">
        <span title="返回到产品线列表页" @click="backTo" class="common-detail-top-title">产品线列表&gt;</span>
        <span>&nbsp;产品线名称 : {{productItem.name || '产品线详情'}}</span>
      </div>
    </div>
    <div class="common-detail-margin">
      <Tabs :animated="false" v-model="tabValue" @on-click="tabclick" class="tabs-fixed">
        <TabPane name="host" label="包含主机">
          <Row v-if="tabValue === 'host'">
            <monitor-host :isProduct="true" ref="productHost"></monitor-host>
          </Row>
        </TabPane>
        <TabPane name="rule" label="包含用户">
          <Row v-if="tabValue === 'rule'">
            <user-list :isProduct="true"></user-list>
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
import monitorHost from '../monitor/monitor-host';
import userList from '../manage/user-list';

export default {
  name: 'productDetail',
  components: {
    monitorHost,
    userList,
  },
  props: {},
  data() {
    return {
      productItem: {}, // 从列表页获取的主机信息
      showResultModal: false,
      tabValue: 'host', // 切换tab
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: '/admin/product/productlist',
      });
    },
    // 设置详情信息
    getDetailData() {
      const productItem = localStorage.getItem('productItem');
      this.productItem = JSON.parse(productItem);
    },
    tabclick() {},
  },
  computed: {
  },
  mounted() {
    this.getDetailData();
    // console.log(this.$route.params.strategyId);
    // if (this.$route.params.strategyId) {
    //   this.getDetailData();
    // }
  },
  beforeDestroy() {
    // localStorage.removeItem('eruleInfo');
  },
};

</script>
