<style lang="scss">
  @import './line-chart-list.scss'
</style>
<template>
  <div class="line-chart-list" id="lineList">
    <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
      <Row slot="listTable">
        <div class="chartBox" v-for="(item, index) in dataList" :key="index">
          <line-chart-item 
          ref="editChart" 
          v-on:mousemove.native="mousemoveListener($event, index)"
          v-on:mouseleave.native="mouseleaveListener($event, index)"
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
import axios from 'axios';
// import $ from 'jquery';
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
      hostInfo: null,
      filter: {
        page: 1,
        page_size: 10,
      },
      total: 0,
      dataList: [], // 看板中所有图表信息
      dataCount: 0,
      time: {
        start: '',
        end: '',
      },
      hostId: '',
      chartCount: 'multiple', // multiple,多图显示;single,单图显示
      defaultList: [
        {
          metric: ['system.load.1min', 'system.load.5min', 'system.load.15min'],
          tags: '',
          name: 'system.load',
        },
        {
          metric: 'system.mem.used_pct',
          tags: '',
        },
        {
          metric: 'system.swap.used_pct',
          tags: '',
        },
        {
          metric: 'system.fd.used_pct',
          tags: '',
        },
        {
          metric: 'system.net.bytes',
          tags: 'iface=eth0|em1,direction=in|out',
        },
        {
          metric: 'system.cpu.idle',
          tags: 'cpu=cpu-total',
        },
      ],
    };
  },
  computed: {},
  watch: {},
  methods: {
    initData(filter, hostInfo) {
      // 内含productId, hostId,开始时间,结束时间
      this.filter.start_time = filter.start_time;
      this.filter.end_time = filter.end_time;
      this.filter.productId = filter.productId;
      this.filter.hostId = filter.hostId;
      this.filter.query = filter.query;
      this.filter.prefix = filter.prefix;
      this.filter.load = filter.load;
      this.chartCount = filter.chartCount;
      this.hostInfo = hostInfo;
      if (filter.load === 'init') {
        this.$refs.page.init();
        this.filter.page = 1;
      }
      if (this.dataList.length > 0) {
        this.$refs.editChart.forEach((item) => {
          item.showLoad();
        });
      }
      this.getData(this.filter);
    },
    // 设置图表的宽度
    setSize(size, index) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[index].style.width = `${(size / 12) * 100}%`;
      });
    },
    showDefault() {
      let tempArr = [];
      const arr = this.defaultList.map((item) => {
        const obj = Object.assign({}, item);
        if (obj.tags) {
          obj.tags = `uuid=${this.filter.hostId},${obj.tags}`;
        } else {
          obj.tags = `uuid=${this.filter.hostId}`;
        }
        return obj;
      });
      if (this.filter.query) {
        tempArr = arr.filter((item) => {
          const obj = Object.assign({}, item);
          const metric = Array.isArray(obj.metric) ? obj.metric.toString() : obj.metric;
          return metric.indexOf(this.filter.query) > -1;
        });
      } else {
        tempArr = arr;
      }
      this.total = tempArr.length;
      this.dataList = tempArr;
      this.dataSetFirst(this.dataList);
    },
    // 获取metric详情数据,获取host下所有metric列表
    getData(params) {
      const param = {
        hostId: params.hostId,
        query: params.query,
        page: params.page,
        page_size: params.page_size,
        prefix: params.prefix,
      };
      if (!param.query) delete param.query;
      if (this.filter.prefix === 'default') {
        this.showDefault();
      } else {
        if (!param.prefix) delete param.prefix;
        getMetricByHost(param).then((res) => {
          if (res.status === 200) {
            this.total = res.data.total;
            this.dataList = res.data.metrics;
            this.dataSetFirst(this.dataList);
          }
        });
      }
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // arr: 该panel下图表list,生成该看板下所有图表
    dataSetFirst(arr) {
      this.dataCount = 0;
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
      // this.setSize(chartItem.span, index); // 设置该图表宽度
      this.setSize(6, index); // 设置该图表宽度
      // 没有数据的设置提示信息暂无数据
      this.$nextTick(() => {
        // 设置请求组
        let axiosArr = [];
        if (Array.isArray(chartItem.metric)) {
          axiosArr = chartItem.metric.map((ele) => {
            const eleItem = ele;
            return getQueryChart({
              metric: eleItem,
              tags: chartItem.tags,
              start: this.filter.start_time,
              end: this.filter.end_time,
            });
          });
        } else {
          axiosArr = [getQueryChart({
            metric: chartItem.metric,
            tags: chartItem.tags,
            start: this.filter.start_time,
            end: this.filter.end_time,
          })];
        }
        // 一个图表的所有element单独获取数据
        axios.all(axiosArr).then((response) => {
          const series = [];
          if (response.length > 0) {
            this.dataCount += 1;
            response.forEach((res) => {
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
              }
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
    mousemoveListener(event, count) {
      const sourceEle = this.$refs.editChart[count]; // 源图表元素
      // 源容器
      const sourceBox = document.getElementsByClassName('chartBox')[count];
      const sourceChart = sourceEle.highchartStore;
      if (sourceChart) {
        sourceChart.pointer.chart.tooltip.options.enabled = true;
        const sourceXAxis = sourceChart.xAxis[0];
        const extremes = sourceXAxis.getExtremes();
        const targetList = this.$refs.editChart; // 所有图表
        targetList.forEach((chart, index) => { // 循环所有图表
          if (index !== count) {
            const targetEle = chart; // 目标图表元素
            // 目标容器
            const targetBox = document.getElementsByClassName('chartBox')[index];
            const targetChart = targetEle.highchartStore; // highcharts图表
            if (targetChart) {
              targetChart.pointer.chart.tooltip.options.enabled = false;
              const sourceOffset = {
                top: sourceBox.offsetTop,
                left: sourceBox.offsetLeft,
              };
              const targetOffset = {
                top: targetBox.offsetTop,
                left: targetBox.offsetLeft,
              };
              const targetE = JSON.parse(JSON.stringify(event));
              // 获取目标和源的图片宽度,修改其他图表事件event点坐标
              // const sourcePlot = sourceBox.find('rect.highcharts-plot-border');
              // const sourceX = parseFloat(sourcePlot.attr('x'));
              // const targetPlot = targetBox.find('rect.highcharts-plot-border');
              // const targetX = parseFloat(targetPlot.attr('x'));
              // const ratio = targetPlot.width() / sourcePlot.width();
              // const ww = ((event.pageX - sourceX) * ratio) +
              // (targetX + (targetOffset.left - sourceOffset.left));
              // targetE.pageX = Math.round(ww);
              targetE.pageX = event.pageX + (targetOffset.left - sourceOffset.left);
              targetE.pageY = event.pageY + (targetOffset.top - sourceOffset.top);
              const targetEl = targetBox.getElementsByClassName('highcharts-background')[0]
              || targetBox.getElementsByClassName('highcharts-tracker')[0];
              targetE.target = targetEl;
              targetE.srcElement = targetEl;
              targetE.fromElement = targetEl;
              targetE.toElement = targetEl;
              targetE.delegateTarget = targetEl;
              targetE.currentTarget = targetEl;
              targetE.originalEvent = targetE;
              if (targetChart && targetChart.pointer) {
                targetChart.pointer.onContainerMouseMove(targetE);
              }
              if (targetChart && targetChart.scroller) {
                targetChart.scroller.mouseMoveHandler(targetE);
              }
              if (sourceChart.mouseIsDown === 'mouseup' || sourceChart.mouseIsDown === 'mousedown') {
                if (targetChart && targetChart.xAxis[0]) {
                  const targetXAxis = targetChart.xAxis[0];
                  targetXAxis.setExtremes(extremes.min, extremes.max);
                }
              }
            }
          }
        });
      }
    },
    // 鼠标离开事件
    mouseleaveListener(event, count) {
      const sourceEle = this.$refs.editChart[count]; // 源图表元素
      const sourceChart = sourceEle.highchartStore;
      if (sourceChart && sourceChart.pointer) {
        sourceChart.pointer.reset();
        sourceChart.pointer.chartPosition = null;
      }
      const targetList = this.$refs.editChart; // 所有图表
      targetList.forEach((chart, index) => {
        if (index !== count) {
          const targetEle = chart;
          const targetChart = targetEle.highchartStore;
          if (targetChart && targetChart.pointer) {
            targetChart.pointer.reset();
            targetChart.pointer.chartPosition = null;
          }
        }
      });
    },
    // 点击事件
    mouseupListener(event, count) {
      const sourceEle = this.$refs.editChart[count]; // 源图表元素
      const sourceChart = sourceEle.highchartStore;
      const e = event;
      e.type = 'mouseup';
      if (sourceChart && sourceChart.pointer) {
        sourceChart.pointer.drop(e);
        sourceChart.mouseIsDown = 'mouseup';
      }
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
      this.dataSetFirst(this.dataList);
    },
  },
  mounted() {
  },
  beforeDestroy() {
  },
};

</script>
