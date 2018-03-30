<style lang="scss">
@import './host-detail-plugin.scss'

</style>
<template>
  <div class="host-detail-plugin mt-10">
    <!-- <div class="host-detail-plugin-title">
      插件列表
    </div> -->
    <div class="clearfix mb-10">
      <div class="float-right">
        <Input style="width:200px;" v-model="searchName" @on-change="search()" placeholder="输入关键字检索"></Input>
      </div>
    </div>
    <div class="host-detail-plugin-content">
      <paging :total="total" @on-page-info-change="pageInfoChange">
        <Table slot="listTable" border :data="dataList" :columns="columns" size="small"></Table>
      </paging>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
// import bus from '../../libs/bus';
import paging from '../page/paging';

export default {
  name: 'hostDetailPlugin',
  components: {
    paging,
  },
  props: {},
  data() {
    return {
      // 过滤器
      filter: {
        pageSize: 10,
        page: 1,
      },
      searchName: '',
      total: 10,
      dataList: [], // 列表
      columns: [{
        title: '插件名',
        key: 'name',
        width: 200,
      }, {
        title: '执行参数',
        key: 'args',
      }, {
        title: '执行间隔',
        key: 'interval',
        width: 150,
      }, {
        title: '超时时间',
        key: 'timeout',
        width: 150,
      }],
    };
  },
  methods: {
    search() {},
    getDetailData() {
      this.dataList = [];
    },
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.pageSize = filter.pageSize;
      this.getHost(this.filter);
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
