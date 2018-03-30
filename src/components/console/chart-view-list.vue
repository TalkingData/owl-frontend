<style lang="scss">
  @import './chart-view-list.scss'
</style>
<template>
  <div>
    <div class="chartBox" v-for="(item, index) in data" :key="item.id">
      <edit-chart-move @on-remove-chart="remove_chart" ref="editChart" :panel-id="panelId" :editChartId="'editChartId' + item.id"></edit-chart-move>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import highstock from 'highcharts/highstock';
import bus from '../../libs/bus';
import { getPanelCharts, getQueryChart } from '../../models/service';
import editChartMove from '../console/edit-chart-move';

require('highcharts/modules/no-data-to-display')(highstock);

export default {
  name: 'chartViewList',
  props: {
    // chartId: {
    //   type: String,
    //   default: 'listId',
    // },
  },
  components: {
    editChartMove,
  },
  data() {
    return {
      data: [], // 看板中所有图表信息
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
  mounted() {
    // 设置时间
    this.$on('set_timer', (interval, panelId) => {
      this.panelId = panelId;
      this.getData(panelId);
      // clearInterval(this.timer);
      // if (interval === 0) {
      //   this.data = [];
      //   this.refresh_data();
      // } else {
      //   this.timer = setInterval(this.refreshAuto, interval);
      // }
    });
    this.$on('clear_timer', () => {
      clearInterval(this.timer);
    });
    // 画图
    this.$on('draw_echarts', (panelId) => {
      this.panelId = panelId;
      this.refresh_data();
    });
    // 刷新图表chart, 需要优化
    bus.$on('refresh_chart', (chartInfo, id) => {
      this.data.forEach((item, index) => {
        if (item.id === id) {
          const chartItem = chartInfo;
          const len = chartItem.elements.length;
          this.set_size(item.size, index);
          // 没有数据的设置提示信息暂无数据
          if (len === 0) {
            this.$nextTick(() => {
              this.$refs.editChart[index].$emit('null_data', chartItem.id, chartItem);
            });
          } else {
            this.$nextTick(() => {
              const axiosArr = chartItem.elements.map((unit) => {
                const filterItem = unit;
                return getQueryChart({
                  metric: filterItem.metric,
                  tags: filterItem.tags,
                  start: bus.selectDate[0].replace(/-/g, '/'),
                  end: bus.selectDate[1].replace(/-/g, '/'),
                });
              });
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
                              // type: 'column',
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
                          seriesItem.theData.data = dpsArr.map(dpsItem =>
                            [dpsItem[0] * 1000, dpsItem[1]]);
                          // seriesItem.theData.data = dpsArr;
                          series.push(seriesItem.theData);
                        });
                      } else {
                        this.$refs.editChart[index].$emit('null_data', this.panelId, chartItem);
                      }
                    }
                  });
                  // chartId, chartData, seriesItem, panelsId, errorMessage
                  this.$refs.editChart[index].$emit('set_data', chartItem.id,
                   chartItem, series, this.panelId, 'errorMessage');
                }
              });
            });
          }
        }
      });
    });
  },
  beforeDestroy() {
    bus.$off('refresh_chart');
    this.$off('set_timer');
  },
  methods: {
    // 设置图表的宽度
    set_size(size, pos) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[pos].style.width = `${25 * size}%`;
      });
    },
    // 获取数据
    getData(id) {
      getPanelCharts({
        panelId: id,
      }).then((res) => {
        if (res.status === 200) {
          this.data = res.data.charts;
          this.dataSetFirst(id, this.data);
        }
      });
    },
    // id: panelId, arr: 该id下图表list
    dataSetFirst(panelId, arr) {
      if (arr.length) {
        arr.forEach((item, index) => {
          const chartItem = item;
          const len = chartItem.elements.length;
          this.set_size(item.size, index);
          // 没有数据的设置提示信息暂无数据
          if (len === 0) {
            this.$nextTick(() => {
              this.$refs.editChart[index].$emit('null_data', chartItem.id, chartItem);
            });
          } else {
            this.$nextTick(() => {
              const axiosArr = chartItem.elements.map((unit) => {
                const filterItem = unit;
                return getQueryChart({
                  metric: filterItem.metric,
                  tags: filterItem.tags,
                  start: bus.selectDate[0].replace(/-/g, '/'),
                  end: bus.selectDate[1].replace(/-/g, '/'),
                });
              });
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
                              // type: 'column',
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
                          seriesItem.theData.data = dpsArr.map(dpsItem =>
                            [dpsItem[0] * 1000, dpsItem[1]]);
                          // seriesItem.theData.data = dpsArr;
                          series.push(seriesItem.theData);
                        });
                      } else {
                        this.$refs.editChart[index].$emit('null_data', panelId, chartItem);
                      }
                    }
                  });
                  // chartId, chartData, seriesItem, panelsId, errorMessage
                  this.$refs.editChart[index].$emit('set_data', chartItem.id,
                   chartItem, series, panelId, 'errorMessage');
                }
              });
            });
          }
        });
      }
    },
    // 刷新数据
    refresh_data() {
      this.time.start = bus.selectDate[0].replace(/-/g, '/');
      this.time.end = bus.selectDate[1].replace(/-/g, '/');
      // 绘制图表
      this.getData(this.panelId);
    },
    remove_chart(id) {
      const len = this.data.length;
      for (let i = 0; i < len; i += 1) {
        const tmp = this.data[i];
        if (tmp.id === id) {
          this.data.splice(i, 1);
          break;
        }
      }
      this.$emit('on-remove-chart-list', id, this.panelId);
    },
  },
};

</script>
