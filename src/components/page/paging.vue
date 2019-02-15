<template>
  <!-- <div class="page-set">
    <slot></slot>
    <div class="common-float-left">
      <Select style="width: 100px;" v-model="pageSize" @on-change="pageSizeChange">
        <Option v-for="item in pageArr" :label="item + '条每页'" :value="item" :key="item">{{item}}条每页</Option>
      </Select>
    </div>
    <div class="common-float-right">
      <Page :total="100" show-total :page-size="pageSize" :current.sync="page" @on-change="pageChange"></Page>
    </div>
  </div> -->
  <div class="page-content">
    <slot></slot>
    <div class="footer clearfix">
      <div class="common-float-left">
        <Select transfer style="width: 100px;" placement="top" v-model="filter.pageSize" @on-change="pageSizeChange">
          <Option v-for="item in pageArr" :label="item + '条每页'" :value="item" :key="item">{{item}}条每页</Option>
        </Select>
      </div>
      <div class="common-float-right">
        <Page :total="total" show-total :page-size="filter.pageSize" :current.sync="filter.page" @on-change="pageChange"></Page>
      </div>
  </div>
  </div>
</template>
<script>
// import bus from '../../libs/bus';

export default {
  name: 'paging',
  props: {
    total: {
      type: Number,
      default: 0,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
  },
  components: {},
  data() {
    return {
      pageArr: [10, 20, 50, 100],
      filter: { // 翻页
        page: 1,
        pageSize: this.pageSize,
      },
    };
  },
  methods: {
    // 页数修改
    pageSizeChange(size) {
      this.filter.page = 1;
      this.filter.pageSize = size;
      this.setInitPage(size);
      this.sendPageInfo();
    },
    // 翻页
    pageChange(current) {
      this.filter.page = current;
      this.sendPageInfo();
    },
    // 触发修改页数事件
    sendPageInfo() {
      this.$emit('on-page-info-change', this.filter);
    },
    init() {
      this.filter.page = 1;
    },
    initSize() {
      this.filter.pageSize = this.pageSize;
    },
    setInitPage(num) {
      const pageInfo = localStorage.getItem('owl_page_info');
      const pageMap = pageInfo ? JSON.parse(pageInfo) : {};
      pageMap.pageSize = num;
      localStorage.setItem('owl_page_info', JSON.stringify(pageMap));
    },
  },
  computed: {
  },
  watch: {
  },
  beforeDestroy() {},
  mounted() {
  },
};

</script>
<style lang="scss" scoped>
  .footer {
    margin-top: 10px;
    .ivu-select-dropdown {
      z-index: 1000;
    }
  }
</style>