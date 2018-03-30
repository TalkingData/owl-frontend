<style lang="scss">
  @import './circle-panel'
</style>
<template>
  <div class="circle-view">
    <div class="title">
      <slot></slot>
    </div>
    <div class="chart-area" ref="circleArea"></div>
  </div>
</template>
<script>
import highcharts from 'highcharts';
// import bus from '../../libs/bus';

require('highcharts/modules/no-data-to-display')(highcharts);

export default {
  name: 'circlePanel',
  props: {
    chartId: {
      type: String,
      default: 'circlePanelId',
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
      this.initChart(obj.set);
    });
  },
  beforeDestroy() {
    this.$off('set_data');
  },
  methods: {
    initChart(dataArg) {
      const params = {
        colors: ['#fe7847', '#f8d249', '#43a3fa', '#ccc'],
        lang: {
          noData: '暂无数据',
        },
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          // spacing: [100, 0, 40, 0],
        },
        credits: {
          enabled: false, // 不显示水印
        },
        title: {
          floating: true,
          verticalAlign: 'middle',
          text: null,
        },
        legend: {
          enabled: true,
          useHTML: true,
          // eslint-disable-next-line
          labelFormatter: function() {
            return `<span class="board-item-label">${this.name}</span>
            <span class="board-item-money">${this.y}</span>`;
          },
          layout: 'vertical',
          width: '100%',
          // itemWidth: '400px',
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              // format: '<b>{point.name}</b>: {point.percentage:.2f}%',
              style: {
                color: (highcharts.theme && highcharts.theme.contrastTextColor) || 'black',
              },
              // eslint-disable-next-line
              formatter: function() {
                if (this.y === 0) {
                  return null;
                }
                return `<b>${this.point.name}</b>: ${(this.percentage).toFixed(3)}%`;
              },
            },
            showInLegend: true,
            point: {
              events: {
                legendItemClick: () => false, // 取消图例默认点击事件
              },
            },
          },
        },
        tooltip: {
          headerFormat: '{series.name}<br>',
          pointFormat: '{point.name}: <b>{point.y}<br>占比：{point.percentage:.3f}%</b>',
        },
        series: [{
          type: 'pie',
          minSize: 100,
          size: '75%',
          innerSize: '80%',
          name: this.data.title,
        }],
      };
      params.series[0].data = dataArg;
      if (this.$refs.circleArea !== null) {
        // eslint-disable-next-line
        highcharts.chart(this.$refs.circleArea, params);
      }
    },
  },
};

</script>
