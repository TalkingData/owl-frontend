<style lang="scss">
  @import './admin-log.scss'
</style>
<template>
  <div class="main-container admin-log-list">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-left">
          <calendar-select ref="calendar" placement="bottom-start" @on-date-change="dateChange"></calendar-select>
        </div>
        <div class="float-right">
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="table-list group-list">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <Table slot="listTable" size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              no-data-text="暂无数据"
              @on-sort-change="handleSort"
            ></Table>
          </paging>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
// import axios from 'axios';
import bus from '../../libs/bus';
import { getOperateLog } from '../../models/service';
import paging from '../../components/page/paging';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'adminLog',
  components: {
    paging,
    calendarSelect,
  },
  data() {
    return {
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
      },
      total: 0, // 总数
      selectedData: [], // 选中数据
      searchName: '', // 搜索名称
      deleteShowData: [],
      columns: [
        {
          title: 'IP',
          key: 'ip',
          // sortable: 'custom',
          width: 180,
        }, {
          title: 'API',
          key: 'api',
          ellipsis: true,
          minWidth: 180,
          render: (h, params) => h('div', {
            attrs: {
              class: 'width-limit',
            },
          }, [h('Poptip', {
            props: {
              placement: 'right',
              width: 400,
              trigger: 'hover',
            },
          }, [h('span', {
            style: {
              color: '#2d8cf0',
              cursor: 'pointer',
            },
          }, params.row.api), h('div', {
            slot: 'title',
          }, 'API详情'), h('div', {
            slot: 'content',
          }, [h('div', {
            attrs: {
              class: 'pop-show-content',
            },
          }, [h('pre', this.getPre(params.row.api))])])])]),
        }, {
          title: '方法类型',
          key: 'method',
          width: 120,
        }, {
          title: '参数',
          key: 'body',
          width: 120,
          render: (h, params) => h('div', [h('Poptip', {
            props: {
              placement: 'right',
              width: 400,
              trigger: 'hover',
            },
          }, [h('span', {
            style: {
              color: '#2d8cf0',
              cursor: 'pointer',
            },
          }, '查看详情'), h('div', {
            slot: 'title',
          }, '参数详情'), h('div', {
            slot: 'content',
          }, [h('div', {
            attrs: {
              class: 'pop-show-content',
            },
          }, [h('pre', this.getPre(params.row.body))])])])]),
        }, {
          title: '操作结果',
          key: 'result',
          width: 100,
          render: (h, params) => h('span', this.getResult(params.row.result)),
        }, {
          title: '操作人',
          key: 'operator',
          minWidth: 120,
        }, {
          title: '操作时间',
          key: 'time',
          minWidth: 120,
        },
      ],
    };
  },
  computed: {
    tableHeight() {
      if (this.dataList.length) {
        if (this.dataList.length > 10) {
          return 520;
        }
        return 40 + (this.dataList.length * 48);
      }
      return 88;
    },
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
        };
      }
      return {
        isRemove: false,
      };
    },
  },
  methods: {
    test(str) {
      const newStr = str.replace(/\n/g, '\\\\n').replace(/\r/g, '\\\\r');
      // eslint-disable-next-line
      // const obj = eval(`(${newStr})`);
      let obj = '';
      try {
        obj = JSON.parse(newStr);
      } catch (error) {
        if (error) {
          obj = str;
        }
      }
      return obj;
    },
    getPre(str) {
      if (str) {
        if (str.indexOf('}') > -1) {
          const newStr = str.replace(/\n/g, '\\\\n').replace(/\r/g, '\\\\r');
          let obj = '';
          try {
            obj = JSON.parse(newStr);
          } catch (error) {
            if (error) {
              obj = str;
              return str;
            }
          }
          if (typeof obj === 'object') {
            return JSON.stringify(obj, null, 2);
          }
          return newStr;
        }
        return str;
      }
      return str;
    },
    // 滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 查看详情
    viewDetail() {
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 获取表格内容数据
    getData(params) {
      this.selectedData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (obj.start_time === obj.end_time) {
        delete obj.start_time;
        delete obj.end_time;
      }
      getOperateLog(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.operations;
        } else {
          this.total = 0;
          this.dataList = [];
        }
      });
    },
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.$refs.page.init();
      this.filter.page = 1;
      this.filter.query = this.searchName.trim();
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.$refs.calendar.reload();
    },
    getResult(result) {
      if (result) return '成功';
      return '失败';
    },
    initTime() {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      start.setSeconds(0);
      end.setSeconds(59);
      this.filter.start_time = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.end_time = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm:ss');
      this.getData(this.filter);
    },
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.filter.page = 1;
      this.getData(this.filter);
    },
  },
  mounted() {
    this.initTime();
  },
  beforeDestroy() {
  },
};

</script>
