<style lang="scss">
  @import './line-chart-list.scss'
</style>
<template>
  <div class="line-chart-list" id="lineList">
    <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
      <Row slot="listTable">
        <div class="chartBox" v-for="(item, index) in dataList" :key="item.metric + index">
          <line-chart-item 
          ref="editChart" 
          @on-refresh-data="refreshChart"
          @on-remove-chart-block="removeChart" 
          @on-edit-chart-block="editData"></line-chart-item>
        </div>
        <Row v-if="dataList.length === 0" style="text-align: center" class="p-10">暂无图表数据</Row>
      </Row>
    </paging>
  </div>
</template>
<script>
// import axios from 'axios';
// import highcharts from 'highcharts';
import highstock from 'highcharts/highstock';
// import bus from '../../libs/bus';
import { getQueryChart, getMetricByHost } from '../../models/service';
import lineChartItem from './line-chart-item';
import paging from '../page/paging';

require('highcharts/modules/no-data-to-display')(highstock);

export default {
  name: 'lineChartList',
  props: {
  },
  components: {
    lineChartItem,
    paging,
  },
  data() {
    return {
      filter: {
        page: 1,
        page_size: 10,
      },
      total: 0,
      dataList: [], // 看板中所有图表信息
      time: {
        start: '',
        end: '',
      },
      hostId: '',
      timer: null,
      showPageData: [],
      chartCount: 'multiple', // multiple,多图显示;single,单图显示
    };
  },
  computed: {},
  watch: {},
  methods: {
    initData(filter) {
      // 内含productId, hostId,开始时间,结束时间
      this.filter.start_time = filter.start_time;
      this.filter.end_time = filter.end_time;
      this.filter.productId = filter.productId;
      this.filter.hostId = filter.hostId;
      this.filter.query = filter.query;
      this.chartCount = filter.chartCount;
      this.getData(this.filter);
    },
    // 设置图表的宽度
    setSize(size, index) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[index].style.width = `${(size / 12) * 100}%`;
      });
    },
    // 获取metric详情数据,获取host下所有metric列表
    getData(params) {
      const param = {
        hostId: params.hostId,
        query: params.query,
        page: params.page,
        page_size: params.page_size,
      };
      if (!param.query) delete param.query;
      getMetricByHost(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.metrics;
          this.dataSetFirst(this.dataList);
          // this.setMetricList(res.data.metrics);
        }
      });
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // arr: 该panel下图表list,生成该看板下所有图表
    dataSetFirst(arr) {
      if (arr.length) {
        arr.forEach((item, index) => {
          this.getChartData(item, index);
        });
        // this.addListener();
      }
    },
    addListener() {
      // eslint-disable-next-line
      document.getElementById('lineList').addEventListener('mousemove', function(e) {
        let chart = '';
        let point = '';
        let event = '';
        let i = 0;
        for (i = 0; i < highstock.charts.length; i += 1) {
          chart = highstock.charts[i];
          event = chart.pointer.normalize(e);
          point = chart.series[0].searchPoint(event, true);
          if (point) {
            point.highlight(e);
          }
        }
      });
      // eslint-disable-next-line
      highstock.Pointer.prototype.reset = function () {
        return undefined;
      };
      // eslint-disable-next-line
      highstock.Point.prototype.highlight = function (event) {
        this.onMouseOver(); // 显示鼠标激活标识
        this.series.chart.tooltip.refresh(this); // 显示提示框
        this.series.chart.xAxis[0].drawCrosshair(event, this); // 显示十字准星线
      };
    },
    // 获取一个图表具体数据,图表信息，图表位置index
    getChartData(chartInfo, pos) {
      const chartItem = chartInfo;
      const index = pos; // 指标
      // this.setSize(chartItem.span, index); // 设置该图表宽度
      this.setSize(6, index); // 设置该图表宽度
      // 没有数据的设置提示信息暂无数据
      this.$nextTick(() => {
        // 一个图表的所有element单独获取数据
        getQueryChart({
          metric: chartItem.metric,
          tags: chartItem.tags,
          start: this.filter.start_time,
          end: this.filter.end_time,
        }).then((res) => {
          const series = [];
          if (res.status === 200 && res.data.code === 200 && res.data.data) {
            // 循环处理每个elements下获取的数据列
            res.data.data.forEach((queryItem) => {
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
            this.$refs.editChart[index].setData(chartItem, series, this.filter);
          } else {
            this.$refs.editChart[index].setData(chartItem, [], this.filter);
          }
        });
      });
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
    setTimer(interval, hostId) {
      this.hostId = hostId;
      this.getData(hostId);
      // clearInterval(this.timer);
      // if (interval === 0) {
      //   this.dataList = [];
      //   this.refreshData();
      // } else {
      //   this.timer = setInterval(this.refreshAuto, interval);
      // }
    },
    // 设置metric列表,将相同metric的tags合并成数组
    setMetricList(arr) {
      this.dataList = [];
      const dataObj = {};
      arr.forEach((item) => {
        if (dataObj[item.metric]) {
          dataObj[item.metric].push(item.tags);
        } else {
          dataObj[item.metric] = [item.tags];
        }
      });
      const metricList = Object.keys(dataObj);
      this.dataList = metricList.map((key) => {
        const chartObj = {
          metric: key,
          tags: dataObj[key],
        };
        return chartObj;
      });
      this.showPageData = this.dataList.slice(0, 10);
      this.dataSetFirst(this.showPageData);
    },
  },
  mounted() {
    // this.addListener();
  },
  beforeDestroy() {
  },
};

</script>
