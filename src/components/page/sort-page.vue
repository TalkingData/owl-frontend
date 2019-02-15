<style lang="scss">
  @import './sort-page.scss';
</style>
<template>
  <div class="sort-page">
    <span class="ivu-table-sort">
      <i class="ivu-icon ivu-icon-arrow-up-b" :class="{on: sortValue === sortAsc}" @click="handleSort(sortName, 'asc')"></i>
      <i class="ivu-icon ivu-icon-arrow-down-b" :class="{on: sortValue === sortDesc}" @click="handleSort(sortName, 'desc')"></i>
    </span>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
// import util from '../libs/util';

export default {
  name: 'sortPage',
  props: {
    // 排序名称
    sortName: {
      type: String,
      default: '',
    },
    // 排序方式
    sortType: {
      type: String,
      default: '',
    },
    sortValue: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
    };
  },
  computed: {
    sortAsc() {
      return `${this.sortName}|asc`;
    },
    sortDesc() {
      return `${this.sortName}|desc`;
    },
  },
  watch: {
  },
  methods: {
    // 排序
    handleSort(sort, type) {
      if (sort && type) {
        const result = `${sort}|${type}`;
        if (this.sortValue === result) {
          this.$emit('on-sort-change', '');
        } else {
          this.$emit('on-sort-change', result);
        }
      }
    },
  },
  mounted() {
  },
  beforeDestroy() {
  },
};
</script>
