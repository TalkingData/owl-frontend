<style lang="scss">
@import './node-list.scss'

</style>
<template>
  <div class="node-list">
    <div class="clearfix mb-10">
      <div class="float-left">
      </div>
      <div class="float-right">
        <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </div>
    <div class="table-list">
      <div class="box-content">
        <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
          <Table slot="listTable" size="small" border
            ref="tablelist"
            :data="dataList" 
            :columns="columns"
            no-data-text="暂无数据"
            ></Table>
        </paging>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getNodeStatus } from '../../../models/service';
import paging from '../../page/paging';

export default {
  name: 'nodeList',
  components: {
    paging,
  },
  props: {},
  data() {
    return {
      saveDataList: [], // 作为备份的数据列表
      // 过滤器
      filter: {
        page_size: 10,
        page: 1,
      },
      searchName: '',
      total: 10,
      allDataList: [],
      dataList: [], // 列表
      selectedData: [], // 选中数据
      deleteShowData: [],
      columns: [
        {
          title: '主机名称',
          key: 'hostname',
        }, {
          title: '地址',
          key: 'ip',
        }, {
          title: '最近更新时间',
          key: 'update',
        },
      ],
    };
  },
  methods: {
    // 获取数据// 获取组下队列列表
    getData() {
      getNodeStatus().then((res) => {
        if (res.status === 200) {
          const arr = Object.values(res.data.nodes);
          // this.total = arr.length;
          this.saveDataList = arr;
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              return obj.hostname.indexOf(this.searchName) > -1 ||
               obj.ip.indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = arr;
          }
          this.total = this.allDataList.length;
          const start = (this.filter.page - 1) * this.filter.page_size;
          const end = this.filter.page * this.filter.page_size;
          this.dataList = this.allDataList.slice(start, end);
          // this.dataList = this.allDataList.slice(0, this.filter.page_size);
        } else {
          this.total = 0;
          this.dataList = [];
          this.allDataList = [];
          this.saveDataList = [];
        }
      });
    },
    reload() {
      this.getData();
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.query = this.searchName;
      this.initFilter();
      if (this.searchName !== '') {
        this.allDataList = this.saveDataList.filter((item) => {
          const obj = item;
          return obj.hostname.indexOf(this.searchName) > -1 ||
           obj.ip.indexOf(this.searchName) > -1;
        });
      } else {
        this.allDataList = this.saveDataList.map((item) => {
          const obj = Object.assign({}, item);
          return obj;
        });
      }
      this.total = this.allDataList.length;
      this.dataList = this.allDataList.slice(0, this.filter.page_size);
      // this.getData(this.filter);
    }, 300),
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
    },
  },
  computed: {
  },
  mounted() {
    this.getData();
  },
  beforeDestroy() {
  },
};

</script>
