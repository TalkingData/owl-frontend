<style lang="scss">
  @import './chart-table.scss';
</style>
<template>
  <div class="chart-table">
    <div class="clearfix">
      <div class="float-left table-title">
        {{data.title}}
      </div>
      <div class="float-right">
        <div class="edit">
          <!-- v-if="firstShow" -->
          <div class="list-icon">
            <span @click="refreshChart" title="刷新" class="set-icon" v-if="showSetting">
              <Icon type="refresh"></Icon>
            </span>
            <span @click="editChart" title="编辑" class="set-icon" v-if="showSetting">
              <Icon type="compose"></Icon>
            </span>
            <span @click="removeChart" title="删除" class="set-icon" v-if="showSetting">
              <Icon type="trash-a"></Icon>
            </span>
            <span @click="showAllScreen" title="全屏" class="set-icon">
              <Icon type="arrow-expand"></Icon>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-10">
      <Table border size="small" :height="350" :data="seriesItem" :columns="columns" :loading="tableLoading"></Table>
    </div>
    <Modal title="查看" v-model="screenModal" width="96%">
      <div class="clearfix">
        <div class="float-left table-title">
          {{data.title}}
        </div>
        <div class="float-right">
          <Icon style="cursor:pointer;" type="refresh" size="16" color="#5aacff" @click.native="refreshChart"></Icon>
        </div>
      </div>
      <div class="mt-10">
        <Table border size="small" :height="350" :data="seriesItem" :columns="columns" :loading="tableLoading"></Table>
      </div>
    </Modal>
  </div>
</template>
<script>
// import axios from 'axios';
import bus from '../../libs/bus';
// import { getQueryChart } from '../../models/service';

export default {
  name: 'chartTable',
  components: {
  },
  props: {
    // 看板id
    panelId: {
      type: Number,
      default: 0,
    },
    // 展示设置内容
    showSetting: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      data: {}, // 该图表信息,chartItem
      seriesItem: [], // 保存信息
      images: '',
      toolbox: false,
      items: {
        metric_name: [], // 每条数据列名称
        xAxis: [],
        theData: [], // series数据组
      },
      panelIdInner: '', // 看板id=panelId,原写作chart,由set_data获取
      firstLoad: false, // 是否第一次加载
      chartType: 'table', // 图表类型
      screenModal: false,
      // 查询数据使用
      filter: {
        start_time: '',
        end_time: '',
      },
      stableFilter: {}, // 保存数据使用,初始化起止时间,单图or多图等
      firstShow: false, // 默认不显示操作按钮,
      tableLoading: false,
      columns: [{
        title: 'metric',
        key: 'metric',
        width: 200,
        sortable: true,
      }, {
        title: 'tag',
        key: 'name',
        minWidth: 200,
        sortable: true,
      }, {
        title: '采集时间',
        key: 'time',
        width: 160,
        render: (h, params) => h('span', bus.timeFormate(params.row.time, 'yyyy-MM-dd hh:mm:ss')),
      }, {
        title: '数值',
        key: 'value',
        width: 160,
        sortable: true,
        render: (h, params) => h('span', this.getNumStr(params.row.value)),
      }],
    };
  },
  computed: {
  },
  watch: {},
  methods: {
    showLoad() {},
    // 展示图表编辑区
    showTool() {
      this.toolbox = !this.toolbox;
    },
    // 重新请求数据 刷新操作
    refreshChart() {
      this.tableLoading = true;
      this.$emit('on-refresh-data', this.data.id);
    },
    // 编辑图表
    editChart() {
      this.$emit('on-edit-chart-block', this.data.id);
    },
    // 删除该图表
    removeChart() {
      this.$emit('on-remove-chart-block', this.data.id);
    },
    // 全屏查看
    showAllScreen() {
      this.screenModal = true;
    },
    // 设置数据, filter区分
    setData(chartItem, seriesItem, panelId, filter) {
      this.firstShow = true; // 展示操作按键
      this.tableLoading = false;
      if (filter) { // 保存数据,用于同步时间
        this.stableFilter = filter;
      }
      this.panelIdInner = panelId;
      this.data = chartItem;
      this.seriesItem = seriesItem;
    },
    // 获取格式
    getNumStr(num) {
      if (num) {
        if (num >= 1000) {
          const kbNum = num / 1000;
          if (kbNum >= 1000) {
            const mbNum = kbNum / 1000;
            if (mbNum > 1000) {
              const gbNum = mbNum / 1000;
              if (gbNum > 1000) {
                const tbNum = gbNum / 1000;
                if (tbNum > 1000) {
                  const pbNum = tbNum / 1000;
                  return `${pbNum.toFixed(2)}PB`;
                }
                return `${tbNum.toFixed(2)}TB`;
              }
              return `${gbNum.toFixed(2)}GB`;
            }
            return `${mbNum.toFixed(2)}MB`;
          }
          return `${kbNum.toFixed(2)}KB`;
        }
        return num.toFixed(2);
      }
      return num;
    },
  },
  mounted() {
    this.firstLoad = false;
  },
  beforeDestroy() {},
};

</script>
