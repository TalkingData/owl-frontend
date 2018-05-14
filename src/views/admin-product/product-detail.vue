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
            <host-list source="product" :isProduct="true" ref="productHost"></host-list>
          </Row>
        </TabPane>
        <TabPane name="user" label="包含用户">
          <Row v-if="tabValue === 'user'">
            <user-list source="product"></user-list>
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
import hostList from '../../components/monitor/host-list';
import userList from '../../components/manage/user-list';

export default {
  name: 'productDetail',
  components: {
    hostList,
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
        path: '/admin/product/list',
      });
    },
    // 设置详情信息
    getDetailData() {
      const productItem = localStorage.getItem('productItem');
      this.productItem = JSON.parse(productItem);
      const type = localStorage.getItem('productItem_type');
      if (type) {
        this.tabValue = type;
      }
    },
    tabclick(name) {
      localStorage.setItem('productItem_type', name);
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
