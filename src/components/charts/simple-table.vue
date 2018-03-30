<style lang="scss">
  @import './simple-table.scss'
</style>
<template>
  <div class="my-table-list">
    <table width="100%" class="show-list-table">
      <thead>
        <tr>
          <th><span class="ivu-table-cell"><Checkbox @on-change="checkAll" v-model="allChecked"></Checkbox></span></th>
          <th v-for="(column, index) in columns" :key='column.key'><span class="ivu-table-cell">{{column.title}}</span></th>
        </tr>
      </thead>
      <tbody v-if="listData.length > 0">
        <tr class="ivu-table-row table-row-cursor" v-for="(item, index) in listData" :key="index" @click.prevent="selectItem(index)">
          <td><span class="ivu-table-cell"><Checkbox v-model="item.check"></Checkbox></span></td>
          <td v-for="(column, index) in columns" :key='column.key'><span class="ivu-table-cell">{{item[column.key]}}</span></td>
        </tr>
      </tbody>
      <tfoot v-else>
        <tr>
          <td class="center-word" :colspan="columnLength">暂无数据</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
<script>
// import bus from '../bus';

export default {
  name: 'simpleTable',
  components: {
  },
  props: {
    // 生成列
    columns: Array,
    // 唯一标识
    tableId: String,
    // 列表data
    data: {
      type: Array,
      default() {
        return [];
      },
    },
    tableLoading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      listData: [],
      // 选中行
      selectionArr: [],
      allChecked: false,
    };
  },
  methods: {
    selectItem(index) {
      this.listData[index].check = !this.listData[index].check;
      this.listData = this.listData.map(item => item);
      this.selectionArr = this.listData.filter(item => item.check);
      this.allChecked = this.listData.length === this.selectionArr.length;
    },
    checkAll(isAll) {
      this.listData = this.listData.map((item) => {
        const obj = item;
        obj.check = isAll;
        return obj;
      });
      this.selectionArr = this.listData.filter(item => item.check);
    },
  },
  mounted() {
  },
  watch: {
    // 选中table中数据后，触发父级中的相应事件
    selectionArr() {
      this.$emit('on-select-row-data', this.selectionArr);
    },
    data() {
      this.allChecked = false;
      this.listData = JSON.parse(JSON.stringify(this.data));
    },
  },
  computed: {
    // listData: {
    //   get() {
    //     return JSON.parse(JSON.stringify(this.data));
    //   },
    //   set(newValue) {
    //     return newValue;
    //   },
    // },
    noDataText() {
      if (this.tableLoading) {
        return '<i class="table-loading demo-spin-icon-load ivu-icon ivu-icon-load-c"></i>';
      }
      return '暂无数据';
    },
    columnLength() {
      return this.columns.length + 1;
    },
  },
};
</script>
