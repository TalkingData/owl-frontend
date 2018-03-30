<style lang="scss">
  @import './chart-block.scss'
</style>
<template>
  <div class="line-chart-block">
    <!-- <div class="chart-select">
      <span title="切换为线图" class="chart-select-btn" @click="changeChart('line')" :class="{ active : chartType === 'line' }">
        <Icon type="ios-pulse"></Icon>
      </span>
      <span title="切换为柱状图" class="chart-select-btn" @click="changeChart('column')" :class="{ active : chartType === 'column' }">
        <Icon type="stats-bars"></Icon>
      </span>
    </div> -->
    <!-- <div class='null'>暂无数据</div> -->
    <div class="edit" v-if="showSetting">
      <span @click="showTool" class="show-icon">
        <Icon type="gear-b"></Icon>
      </span>
      <div class="list-icon" v-if="toolbox">
        <span @click="refreshChart" title="刷新" class="set-icon">
          <Icon type="refresh"></Icon>
        </span>
        <span @click="editChart" title="编辑" class="set-icon">
          <Icon type="compose"></Icon>
        </span>
        <span @click="removeChart" title="移除" class="set-icon">
          <Icon type="ios-minus-outline"></Icon>
        </span>
      </div>
    </div>
    <!-- <div class="line-area" :id="editChartId"></div> -->
    <div class="line-area" ref="lineChartArea"></div>
  </div>
</template>
<script>
// import highcharts from 'highcharts';
import highstock from 'highcharts/highstock';
import bus from '../../../libs/bus';

require('highcharts/modules/no-data-to-display')(highstock);

export default {
  name: 'lineChartBlock',
  props: {
    editChartId: {
      type: String,
      default: 'editChartId',
    },
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
      data: [], // 该图表信息,chartItem
      images: '',
      toolbox: false,
      chart_id: '',
      items: {
        metric_name: [], // 每条数据列名称
        xAxis: [],
        theData: [], // series数据组
      },
      nullData: '',
      panelIdInner: '', // 看板id=panelId,原写作chart,由set_data获取
      chartName: '',
      firstLoad: false, // 是否第一次加载
      highchartStore: null,
      chartType: 'line', // 图表类型
    };
  },
  computed: {},
  watch: {},
  methods: {
    // 展示图表编辑区
    showTool() {
      this.toolbox = !this.toolbox;
    },
    // 修改图表类型
    changeChart(type) {
      this.chartType = type;
      this.highchartStore.update({
        chart: {
          type: this.chartType,
        },
      });
    },
    // 重新请求数据 刷新操作-> console, create-board
    refreshChart() {
      this.$emit('on-refresh-data', this.data.id);
      this.showTool();
    },
    // 编辑图表
    editChart() {
      this.$emit('on-edit-chart-block', this.data.id);
      this.showTool();
    },
    // 删除该图表
    removeChart() {
      this.$emit('on-remove-chart-block', this.data.id);
      this.showTool();
    },
    initChart(chartInfo, dataArg) {
      const self = this;
      this.chartType = '';
      if (chartInfo.type === 1) {
        this.chartType = 'line';
      } else if (chartInfo.type === 2) {
        this.chartType = 'column';
      }
      // const self = this;
      highstock.setOptions({
        lang: {
          noData: '暂无数据',
        },
        navigation: {
          menuItemStyle: {
            padding: '6px 14px',
          },
        },
        global: {
          useUTC: false,
        },
      });
      const params = {
        colors: ['#f7acbc', '#f05b72', '#cd9a5b', '#66ffff', '#ccFF66',
          '#1d953f', '#abc88b', '#769149', '#7f7522', '#9b95c9',
          '#f3715c', '#ea66a6', '#d1c7b7', '#9d9087', '#77787b',
          '#f58220', '#c37e00', '#918597', '#f26522', '#FF00FF',
          '#76624c', '#1b315e', '#2468a2', '#ca8687', '#bd6758',
          '#596032', '#5f5d46', '#00ae9d', '#70a19f', '#005344',
          '#d71345', '#7bbfea', '#76becc', '#b3424a', '#f47920',
        ],
        chart: {
          // renderTo: this.editChartId,
          renderTo: this.$refs.lineChartArea,
          zoomType: 'x',
          plotBorderWidth: 1,
          type: this.chartType,
          height: chartInfo.height || 400,
        },
        credits: {
          enabled: false, // 不显示水印
        },
        title: {
          text: chartInfo.title,
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          labels: {
            // eslint-disable-next-line
            // formatter: function() {
            //   return bus.timeFormate(this.value, 'yyyy-MM-dd');
            // },
          },
          dateTimeLabelFormats: {
            millisecond: '%Y-%m-%d<br/>%H:%M:%S',
            second: '%Y-%m-%d<br/>%H:%M:%S',
            minute: '%Y-%m-%d<br/>%H:%M',
            hour: '%Y-%m-%d<br/>%H:%M',
            day: '%Y<br/>%m-%d',
            week: '%Y<br/>%m-%d',
            month: '%Y-%m',
            year: '%Y',
          },
          // showFirstLabel: true,
          // showLastLabel: true,
          ordinal: false,
        },
        navigator: {
          height: 20,
          xAxis: {
            type: 'datetime',
            labels: {
              // eslint-disable-next-line
              // formatter: function() {
              //   return bus.timeFormate(this.value, 'yyyy-MM-dd');
              // },
            },
            dateTimeLabelFormats: {
              millisecond: '%Y-%m-%d<br/>%H:%M:%S',
              second: '%Y-%m-%d<br/>%H:%M:%S',
              minute: '%Y-%m-%d<br/>%H:%M',
              hour: '%Y-%m-%d<br/>%H:%M',
              day: '%Y-%m-%d',
              week: '%Y-%m-%d',
              month: '%Y-%m',
              year: '%Y',
            },
          },
        },
        yAxis: {
          gridLineColor: '#DCDCDC',
          title: {
            text: null,
          },
          opposite: false,
          // eslint-disable-next-line
          // tickPositioner: function() {
          //   const positions = [];
          //   let tick = 0;
          //   if (chartInfo.unit === 'percent') {
          //     const increment = Math.ceil((100 - 0) / 4);
          //     for (tick; tick - increment <= this.dataMax; tick += increment) {
          //       positions.push(tick);
          //     }
          //   } else if (chartInfo.unit === 'byte') {
          //     const increment = Math.ceil(((this.dataMax * 1.2) - 0) / 4);
          //     for (tick; tick - increment <= this.dataMax; tick += increment) {
          //       positions.push(tick);
          //     }
          //   }
          //   return positions;
          // },
          // maxZoom: 0.1,
        },
        legend: {
          maxHeight: 80,
          enabled: true,
          align: 'left',
          verticalAlign: 'bottom',
          y: 0,
        },
        rangeSelector: {
          inputEnabled: false,
          enabled: false,
        },
        plotOptions: {
          area: {
            lineWidth: 1,
            stacking: 'normal',
          },
          series: {
            animation: false,
            states: {
              hover: {
                lineWidth: 1,
              },
            },
          },
        },
        tooltip: {
          shared: true,
          // eslint-disable-next-line
          formatter: function() {
            let str = `<span style="font-weight: bold;">
            ${bus.timeFormate(this.x, 'yyyy-MM-dd hh:mm:ss')}</span>`;
            if (chartInfo.unit === 'percent') {
              this.points.forEach((item) => {
                const point = item;
                str += `<br/><span style="color: ${point.series.color}">${point.series.name}</span>
                 : ${point.y.toFixed(2)}%`;
              });
            } else if (chartInfo.unit === 'byte') {
              this.points.forEach((item) => {
                const point = item;
                const byte = point.y / 1024;
                // const byte = point.y;
                str += `<br/><span style="color: ${point.series.color}">${point.series.name}</span>
                 : ${byte.toFixed(2)}kb`;
              });
            }
            return str;
          },
        },
        series: [],
      };
      // params.series = dataArg;
      params.series = dataArg.map((item) => {
        const obj = item;
        obj.events = {
          // eslint-disable-next-line
          legendItemClick: function(event) {
            const start = new Date();
            event.preventDefault();
            // let operateObj = null; // 保存要显示的条目
            let visibleAll = true; // 全部显示
            let visibleThis = true; // 点击是否是同一个条目
            self.highchartStore.series.forEach((serie, i) => {
              if (!serie.visible) {
                // 如果有非显示状态的,表示显示单个
                visibleAll = false;
                // 该种情况表示点击了其他隐藏状态数据
                if (event.target.index === i) {
                  visibleThis = false;
                }
              }
            });
            if (visibleAll || !visibleThis) {
              self.highchartStore.series.forEach((serie, i) => {
                const operateObj = serie;
                if (event.target.index === i) {
                  // operateObj.show();
                  operateObj.setVisible(true, false);
                } else {
                  // operateObj.hide();
                  operateObj.setVisible(false, false);
                }
              });
            } else {
              self.highchartStore.series.forEach((serie) => {
                const operateObj = serie;
                // operateObj.show();
                operateObj.setVisible(true, false);
              });
            }
          },
        };
        return obj;
      });
      // eslint-disable-next-line
      this.highchartStore = new highstock.StockChart(params);
    },
    // 设置数据
    setData(chartItem, seriesItem) {
      this.data = chartItem;
      this.chart_id = `img${chartItem.id}`;
      this.initChart(chartItem, seriesItem);
    },
    nullData() {},
  },
  mounted() {
    this.firstLoad = false;
    // 查看时无数据
    this.$on('null_data', (chart, data, message) => {
      this.nullData(chart, data, message);
      // this.chartId = `img${data.id}`;
      // this.id = data.id;
      // if (this.chart === chart) {
      //   setTimeout(() => {
      //     this.myChart.hideLoading();
      //   }, 500);
      //   this.nullData = message || '暂无数据......';
      // }
    });
    // chartData, seriesItem, panelsId, errorMessage
    // eslint-disable-next-line
    this.$on('set_data', (chartItem, seriesItem, panelId) => {
      this.panelIdInner = panelId;
      this.data = chartItem;
      this.chart_id = `img${chartItem.id}`;
      this.initChart(chartItem, seriesItem);
    });
  },
  beforeDestroy() {},
};

</script>
