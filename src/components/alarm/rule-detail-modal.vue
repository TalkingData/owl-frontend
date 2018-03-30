<style lang="scss">
  @import './rule-detail-modal'
</style>
<template>
  <div>
    <Modal class="rule-detail-modal" v-model="alarmModal" :title="alarmTitle" width="80">
     <!--  <div slot="header" class="clearfix">
      </div> -->
      <div class="clearfix mb-10">
        <div class="float-left">
          <!-- <Select v-model="filter.status" style="width: 100px;" @on-change="selectStatus">
            <Option value="all">all</Option>
            <Option :value="5">5</Option>
            <Option :value="4">4</Option>
          </Select> -->
        </div>
        <div class="float-right" style="width: 300px;">
          <Input v-model="searchName" placeholder="搜索" @on-change="search"></Input>
        </div>
      </div>
      <paging :total="total" ref="pageFault" @on-page-info-change="pageInfoChange">
        <Table slot="listTable" border size="small" 
        :data="alarmData" 
        :columns="alarmColumn"
        :height="tableHeight"></Table>
      </paging>
      <div slot="footer">
        <Button type="primary" @click="close">确认</Button>
        <Button @click="close">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import { getEventsFailed } from '../../models/service';
import paging from '../page/paging';

export default {
  name: 'ruleDetailModal',
  components: {
    paging,
  },
  props: {},
  data() {
    return {
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
      },
      total: 50,
      searchName: '',
      alarmModal: false, // 查看告警详情
      alarmTitle: '',
      alarmData: [],
      alarmColumn: [{
        title: '状态',
        key: 'status',
        width: 100,
        render: (h, params) => h('div', {
          attrs: {
            class: 'word-break',
          },
        }, this.getStatus(params.row.status)),
      }, {
        title: '主机名',
        key: 'hostname',
        width: 300,
        className: 'hidden',
        render: (h, params) => h('Poptip', {
          props: {
            content: params.row.hostname,
            trigger: 'hover',
          },
        }, params.row.hostname),
      }, {
        title: 'IP',
        key: 'ip',
      }, {
        title: '错误信息',
        key: 'message',
        className: 'hidden',
        render: (h, params) => h('Poptip', {
          props: {
            placement: 'bottom-start',
            trigger: 'hover',
          },
        }, [params.row.message, h('div', {
          slot: 'content',
          attrs: {
            class: 'word-break',
          },
        }, params.row.message)]),
      }, {
        title: '上报时间',
        key: 'update_time',
      }],
    };
  },
  methods: {
    // 初始化过滤条件
    initFilter() {
      this.$refs.pageFault.init();
      this.filter.page = 1;
      this.searchName = '';
      this.filter.query = '';
      this.filter.page_size = 10;
      this.$refs.pageFault.initSize();
    },
    // 关闭
    close() {
      this.initFilter();
      this.alarmModal = false;
    },
    // 查看告警状态详情
    showAlarm(alarm, name, status) {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      this.alarmTitle = name;
      this.alarmModal = true;
      if (status === 4) {
        this.filter.status = 4; // 无数据状态
        this.alarmTitle = `${name} : 无数据状态报警事件列表`;
      } else if (status === 5) {
        this.filter.status = 5; // 未知状态
        this.alarmTitle = `${name} : 未知状态报警事件列表`;
      }
      this.filter.strategy_id = alarm.id;
      this.initFilter();
      this.getData(this.filter);
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 搜索
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.$refs.pageFault.init();
      this.filter.page = 1;
      this.getData(this.filter);
    }, 300),
    // 状态选择
    selectStatus(status) {
      if (status === 'all') {
        delete this.filter.status;
      } else {
        this.filter.status = status;
      }
      this.getData(this.filter);
    },
    // 获取告警状态
    getStatus(num) {
      let status = '';
      if (num === 4) {
        status = 'nodata';
      } else if (num === 5) {
        status = 'unknow';
      }
      return status;
    },
    // 获取数据
    getData(params) {
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      getEventsFailed(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.alarmData = res.data.events_failed ? res.data.events_failed : [];
        }
      });
    },
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isCorrelate: true,
        };
      }
      return {
        isRemove: false,
        isCorrelate: false,
      };
    },
    tableHeight() {
      if (this.alarmData.length >= 8) {
        return 360;
      }
      return '';
    },
  },
  mounted() {
    // this.getData();
  },
  beforeDestroy() {},
};

</script>
