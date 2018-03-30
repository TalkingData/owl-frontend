<style lang="scss">
  @import './chart-list.scss'
</style>
<template>
  <div>
    <div class="chartBox" v-for="(item, index) in dataList" :key="item.id">
      <!-- <div>{{item.title}}</div> -->
      <line-chart-block 
      ref="editChart" 
      @on-refresh-data="refreshChart"
      @on-remove-chart-block="removeChart" 
      @on-edit-chart-block="editData"
      :panel-id="filter.panelId" 
      :editChartId="'editChartId' + item.id"></line-chart-block>
    </div>
    <Row v-if="dataList.length === 0" style="text-align: center" class="p-10">暂无图表数据</Row>
  </div>
</template>
<script>
import axios from 'axios';
import highstock from 'highcharts/highstock';
// import bus from '../../libs/bus';
import { getPanelCharts, getQueryChart } from '../../models/service';
import lineChartBlock from './line-chart-block';

require('highcharts/modules/no-data-to-display')(highstock);

export default {
  name: 'chartList',
  props: {
  },
  components: {
    lineChartBlock,
  },
  data() {
    return {
      filter: {},
      dataList: [], // 看板中所有图表信息
      time: {
        start: '',
        end: '',
      },
      panelId: '',
      timer: null,
    };
  },
  computed: {},
  watch: {},
  methods: {
    initData(filter) {
      // 内含productId, panelId,开始时间,结束时间
      this.filter = filter;
      this.getData(this.filter);
    },
    // 设置图表的宽度
    setSize(size, index) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[index].style.width = `${(size / 12) * 100}%`;
      });
    },
    // 获取panel详情数据,获取panel下所有chart列表
    getData(params) {
      const param = {
        panelId: params.panelId,
        productId: params.productId,
        query: params.query,
      };
      if (!param.query) delete param.query;
      getPanelCharts(param).then((res) => {
        if (res.status === 200) {
          this.dataList = res.data.charts;
          // this.dataSetFirst(this.dataList, 'all');
          this.dataSetFirst(this.dataList);
        }
      });
    },
    // arr: 该panel下图表list,生成该看板下所有图表
    dataSetFirst(arr) {
      if (arr.length) {
        arr.forEach((item, index) => {
          this.getChartData(item, index);
        });
      }
    },
    // 获取一个图表具体数据,图表信息，图表位置index
    getChartData(chartInfo, pos) {
      const chartItem = chartInfo;
      const index = pos; // 指标
      const len = chartItem.elements.length;
      this.setSize(chartItem.span, index); // 设置该图表宽度
      // 没有数据的设置提示信息暂无数据
      if (len === 0) {
        this.$nextTick(() => {
          this.$refs.editChart[index].setData(chartItem, [], this.filter.panelId, this.filter);
          // this.$refs.editChart[index].$emit('null_data', chartItem.id, chartItem);
        });
      } else {
        this.$nextTick(() => {
          const axiosArr = chartItem.elements.map((ele) => {
            const filterItem = ele;
            return getQueryChart({
              metric: filterItem.metric,
              tags: filterItem.tags,
              start: this.filter.start_time,
              end: this.filter.end_time,
            });
          });
          // 一个图表的所有element单独获取数据
          axios.all(axiosArr).then((res) => {
            if (res.length > 0) {
              const series = [];
              res.forEach((response) => {
                if (response.data.code === 200) {
                  if (response.data.data) {
                    // 循环处理每个elements下获取的数据列
                    response.data.data.forEach((queryItem) => {
                      const seriesItem = {
                        theData: {
                          name: '',
                          data: [],
                          visible: true,
                          threshold: null,
                        },
                        metric_name: '',
                      };
                      // 图表中每条线的名字,后半部分
                      let host = `${queryItem.metric}, `;
                      const tagsArr = Object.keys(queryItem.tags);
                      tagsArr.forEach((tag) => {
                        if (tag !== 'uuid') {
                          host += `${tag}=${queryItem.tags[tag]}, `;
                        }
                      });
                      // 图表中每条线的名字,去掉最后的逗号与空格
                      seriesItem.theData.name = host.substring(0, host.length - 2);
                      seriesItem.metric_name = seriesItem.theData.name;
                      // 设置时间-数据格式对
                      const dpsArr = Object.entries(queryItem.dps);
                      // 将秒改为毫秒
                      seriesItem.theData.data = dpsArr.map(dpsItem =>
                        [dpsItem[0] * 1000, dpsItem[1]]);
                      series.push(seriesItem.theData);
                    });
                  }
                }
              });
              // chartData, seriesItem, panelsId, filter
              this.$refs.editChart[index].setData(chartItem, series,
                this.filter.panelId, this.filter);
            } else {
              this.$refs.editChart[index].setData(chartItem, [], this.filter.panelId, this.filter);
            }
          });
        });
      }
    },
    // 刷新列表中的一个图表
    refreshChart(chartId) {
      this.dataList.forEach((item, index) => {
        if (item.id === chartId) {
          this.getChartData(item, index);
        }
      });
    },
    // 刷新数据
    refreshData() {
      this.getData(this.filter);
    },
    // 删除图表
    removeChart(chartId) {
      const chart = this.dataList.find(item => item.id === chartId);
      if (chart) {
        this.$emit('on-remove-chart', chart);
      }
    },
    // 编辑图表
    editData(chartId) {
      // 获取该id下chart的相关信息
      const chart = this.dataList.find(item => item.id === chartId);
      if (chart) {
        this.$emit('on-edit-chart', chart);
      }
    },
    // 设置时间,进行自动刷新
    setTimer(interval, panelId) {
      this.panelId = panelId;
      this.getData(panelId);
      // clearInterval(this.timer);
      // if (interval === 0) {
      //   this.dataList = [];
      //   this.refreshData();
      // } else {
      //   this.timer = setInterval(this.refreshAuto, interval);
      // }
    },
  },
  mounted() {
    // 设置时间
    this.$on('set_timer', (interval, panelId) => {
      this.setTimer(interval, panelId);
    });
    this.$on('clear_timer', () => {
      clearInterval(this.timer);
    });
  },
  beforeDestroy() {
    this.$off('set_timer');
  },
};

</script>
