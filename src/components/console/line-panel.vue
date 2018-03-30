<style lang="scss">
  @import './line-panel.scss'
</style>
<template>
  <div class="line-view">
    <div class="lines-area" ref="linesArea"></div>
  </div>
</template>
<script>
import highstock from 'highcharts/highstock';
import bus from '../../libs/bus';

// require('highcharts/modules/exporting')(highstock);
// require('highcharts/modules/export-data')(highstock);
require('highcharts/modules/no-data-to-display')(highstock);

export default {
  name: 'linePanel',
  props: {
    chartId: {
      type: String,
      default: 'linePanelId',
    },
  },
  data() {
    return {
      data: {
        set: [],
        title: '',
      },
      percent: '',
      value: '',
      name: '',
    };
  },
  computed: {},
  watch: {},
  mounted() {
    this.$on('set_data', (obj) => {
      this.data = obj;
      this.dataHandle(obj);
    });
  },
  beforeDestroy() {
    this.$off('set_data');
  },
  methods: {
    dataHandle(tmp) {
      if (tmp.length === 0) {
        this.initChart([]);
      } else {
        const set1 = [];
        const set2 = [];
        const set3 = [];
        this.data.set = [];
        const len = tmp.length;
        for (let i = 0; i < len; i += 1) {
          const time = new Date(`${tmp[i].days} 00:00:00`).getTime();
          set1.push([time, tmp[i].high_count]);
          set2.push([time, tmp[i].middle_count]);
          set3.push([time, tmp[i].low_count]);
        }
        const obj1 = {
          name: '严重',
          data: set1,
          type: 'line',
          visible: true,
          threshold: null,
        };
        const obj2 = {
          name: '较严重',
          data: set2,
          type: 'line',
          visible: true,
          threshold: null,
        };
        const obj3 = {
          name: '注意',
          data: set3,
          type: 'line',
          visible: true,
          threshold: null,
        };
        this.data.set[0] = obj1;
        this.data.set[1] = obj2;
        this.data.set[2] = obj3;
        this.initChart(this.data.set);
      }
    },
    initChart(dataArg) {
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
        colors: ['#fe7847', '#f8d249', '#43a3fa', '#ccc'],
        chart: {
          renderTo: this.$refs.linesArea,
          zoomType: 'x',
          plotBorderWidth: 1,
        },
        credits: {
          enabled: false, // 不显示水印
        },
        title: {
          text: '告警级别趋势分布',
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          labels: {
            // eslint-disable-next-line
            formatter: function() {
              return bus.timeFormate(this.value, 'yyyy-MM-dd');
            },
          },
          // showFirstLabel: true,
          // showLastLabel: true,
          ordinal: false,
        },
        navigator: {
          xAxis: {
            type: 'datetime',
            labels: {
              // eslint-disable-next-line
              formatter: function() {
                return bus.timeFormate(this.value, 'yyyy-MM-dd');
              },
            },
          },
        },
        yAxis: {
          gridLineColor: '#DCDCDC',
          title: {
            text: null,
          },
          opposite: false,
          // maxZoom: 0.1,
        },
        legend: {
          enabled: true,
          align: 'right',
          verticalAlign: 'top',
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
            ${bus.timeFormate(this.x, 'yyyy-MM-dd')}</span>`;
            for (let i = 0; i < this.points.length; i += 1) {
              const point = this.points[i];
              str += `<br/><span style="color: ${point.series.color}">${point.series.name}</span>
               : ${point.y}`;
            }
            return str;
          },
        },
        series: [],
      };
      params.series = dataArg;
      // eslint-disable-next-line
      new highstock.StockChart(params);
    },
  },
};

</script>
