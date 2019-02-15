<style lang="scss">
  @import './line-chart-list.scss';
</style>
<template>
  <div class="line-chart-list" id="lineList">
    <Row class="mb-10">
      <div class="float-left">
        <calendar-select ref="calendar"
        @on-date-change="dateChange"
        placement="bottom-start"
        :refresh="true"></calendar-select>
      </div>
      <div class="float-right">
        总数：{{total}}
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </Row>
    <Row>
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
  </div>
</template>
<script>
// import axios from 'axios';
import bus from '../../libs/bus';
import { getQueryChart } from '../../models/service';
import lineChartItem from './line-chart-item';
import calendarSelect from '../page/calendar-select';

export default {
  name: 'lineChartList',
  props: {
  },
  components: {
    lineChartItem,
    calendarSelect,
  },
  data() {
    return {
      hostInfo: null,
      filter: {
        start_time: '',
        end_time: '',
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
    };
  },
  computed: {},
  watch: {},
  methods: {
    // 取消刷新
    close() {
      this.$refs.calendar.close();
    },
    // 初始化数据
    initData(filter, hostInfo, arr) {
      this.close();
      this.dataList = arr;
      this.total = this.dataList.length;
      // 内含productId, hostId,开始时间,结束时间
      // 初始化时间
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      start.setSeconds(0);
      end.setSeconds(59);
      this.filter.start_time = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.end_time = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.productId = filter.productId;
      this.filter.hostId = filter.hostId;
      // this.filter.load = filter.load;
      this.chartCount = filter.chartCount;
      this.hostInfo = hostInfo;
      this.dataSetFirst(this.dataList);
    },
    // 设置图表的宽度
    setSize(size, index) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[index].style.width = `${(size / 12) * 100}%`;
      });
    },
    // 获取metric详情数据,获取host下所有metric列表
    getData() {
      // 刷新时,增加loading状态
      if (this.dataList.length > 0) {
        this.$refs.editChart.forEach((item) => {
          item.showLoad();
        });
      }
      this.dataSetFirst(this.dataList);
    },
    // 刷新
    reload() {
      this.$refs.calendar.reload();
      // this.getData(this.filter);
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
      const chartItem = Object.assign({}, chartInfo);
      const index = pos; // 指标
      // this.setSize(chartItem.span, index); // 设置该图表宽度
      this.setSize(6, index); // 设置该图表宽度为6
      // 没有数据的设置提示信息暂无数据
      this.$nextTick(() => {
        const tagOnly = chartItem.tags ? `host=${this.hostInfo.hostname},${chartItem.tags}` :
          `host=${this.hostInfo.hostname}`;
        chartItem.tags = tagOnly; // 用于line-chart-item请求使用
        // 一个图表的所有element单独获取数据
        getQueryChart({
          metric: chartItem.metric,
          tags: tagOnly,
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
              tagsArr.forEach((tag, i) => {
                if (tag !== 'uuid') {
                  host += i === 0 ? `${tag}=${queryItem.tags[tag]}` : `, ${tag}=${queryItem.tags[tag]}`;
                }
              });
              // 图表中每条线的名字,去掉最后的逗号与空格
              seriesItem.theData.name = host;
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
          const targetEle = chart; // 目标图表元素
          // 所有容器添加hover效果，展示crosshair,修复最后一个图不展示crosshair问题
          const targetBox = document.getElementsByClassName('chartBox')[index];
          if (!targetBox.classList.contains('hover')) {
            targetBox.classList.add('hover');
          }
          if (index !== count) {
            // 目标容器
            const targetChart = targetEle.highchartStore; // highcharts图表
            if (targetChart) {
              // 设置目标事件的弹出框不显示
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
    // 修改时间
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.filter.load = 'refresh';
      this.getData(this.filter);
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
        // 目标容器,取消所有图表hover,隐藏crosshair
        const targetBox = document.getElementsByClassName('chartBox')[index];
        if (targetBox.classList.contains('hover')) {
          targetBox.classList.remove('hover');
        }
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
  },
  mounted() {
  },
  beforeDestroy() {
  },
};

</script>
