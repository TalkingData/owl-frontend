<style lang="scss">
  @import './chart-list.scss';
</style>
<template>
  <div>
    <div class="chartBox" v-for="(item, index) in dataList" :key="item.id">
      <line-chart-block v-if="item.type === 1 || item.type === 2 || item.type === 4" :key="'inner' + item.id"
      ref="editChart" 
      @on-refresh-data="refreshChart"
      @on-remove-chart-block="removeChart" 
      @on-edit-chart-block="editData"
      :panel-id="filter.panelId" 
      :editChartId="'editChartId' + item.id"></line-chart-block>
      <chart-table v-if="item.type === 3" ref="editChart" :key="'inner' + item.id"
      @on-refresh-data="refreshChart"
      @on-remove-chart-block="removeChart" 
      @on-edit-chart-block="editData"
      :panel-id="filter.panelId" 
      :editChartId="'editChartId' + item.id"></chart-table>
    </div>
    <Row v-if="dataList.length === 0" style="text-align: center" class="p-10">暂无图表数据</Row>
  </div>
</template>
<script>
import axios from 'axios';
import bus from '../../libs/bus';
import { getPanelCharts, getQueryChart } from '../../models/service';
import lineChartBlock from './line-chart-block';
import chartTable from './chart-table';

export default {
  name: 'chartList',
  props: {
  },
  components: {
    lineChartBlock,
    chartTable,
  },
  data() {
    return {
      productId: 0,
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
      this.dataList = [];
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
      this.productId = params.productId;
      if (this.dataList.length > 0) {
        this.$refs.editChart.forEach((item) => {
          item.showLoad();
        });
      }
      const param = {
        panelId: params.panelId,
        productId: params.productId,
        query: params.query,
        paging: false,
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
    getChartData(chartInfo, pos, filterType) {
      const chartItem = chartInfo;
      const index = pos; // 指标
      const len = chartItem.elements.length;
      this.setSize(chartItem.span, index); // 设置该图表宽度
      // 没有数据的设置提示信息暂无数据
      if (len === 0) {
        this.$nextTick(() => {
          this.$refs.editChart[index].setData(chartItem, [], this.filter.panelId, this.filter);
        });
      } else {
        let startTime = '';
        let endTime = '';
        if (filterType === 'refresh') {
          const now = new Date();
          const origin = new Date(this.filter.end_time);
          const numInterval = now.getTime() - origin.getTime();
          if (numInterval >= 6000) {
            startTime = this.getNewTime(this.filter.start_time, numInterval);
            endTime = bus.timeFormate(now, 'yyyy/MM/dd-hh:mm:ss');
          } else {
            startTime = this.filter.start_time;
            endTime = this.filter.end_time;
          }
        } else {
          startTime = this.filter.start_time;
          endTime = this.filter.end_time;
        }
        this.$nextTick(() => {
          const axiosArr = chartItem.elements.map((ele) => {
            const filterItem = ele;
            return getQueryChart({
              product_id: this.productId,
              metric: filterItem.metric,
              tags: filterItem.tags,
              start: startTime,
              end: endTime,
            });
          });
          // 一个图表的所有element单独获取数据
          axios.all(axiosArr).then((res) => {
            if (res.length > 0) {
              const series = [];
              const tableData = [];
              const sumData = {
                name: 'sum',
                data: [],
                visible: true,
                threshold: null,
              };
              res.forEach((response, innerPos) => {
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
                      // 设置时间-数据格式对
                      const dpsArr = Object.entries(queryItem.dps);
                      // 判断是否有数据
                      if (dpsArr.length > 0 && tagsArr.length > 0) {
                        tagsArr.forEach((tag, i) => {
                          if (tag !== 'uuid') {
                            host += i === 0 ? `${tag}=${queryItem.tags[tag]}` : `, ${tag}=${queryItem.tags[tag]}`;
                          }
                        });
                        // 图表中每条线的名字,去掉最后的逗号与空格
                        seriesItem.theData.name = host;
                        seriesItem.metric_name = seriesItem.theData.name;
                        // 将秒改为毫秒
                        seriesItem.theData.data = dpsArr.map((dpsItem, dpsIndex) => {
                          if (sumData.data[dpsIndex]) {
                            const sumNum = sumData.data[dpsIndex][1] || 0;
                            sumData.data[dpsIndex][1] = sumNum + dpsItem[1];
                          } else {
                            sumData.data[dpsIndex] = [dpsItem[0] * 1000, dpsItem[1]];
                          }
                          return [dpsItem[0] * 1000, dpsItem[1]];
                        });
                        tableData.push({
                          name: host.slice(host.indexOf(', ') + 1),
                          metric: queryItem.metric,
                          time: (dpsArr[dpsArr.length - 1][0]) * 1000,
                          value: dpsArr[dpsArr.length - 1][1],
                        });
                        series.push(seriesItem.theData);
                      } else if (chartItem.elements && chartItem.elements[innerPos]) {
                        // 无数据提示
                        const currentInfo = chartItem.elements[innerPos];
                        const errorMsg = `图表 ${chartItem.title} 中 ${currentInfo.metric},${currentInfo.tags} 无数据`;
                        this.$Message.warning({
                          duration: 15,
                          content: errorMsg,
                          closable: true,
                        });
                      }
                    });
                  }
                }
              });
              // chartData, seriesItem, panelsId, filter
              if (chartItem.type === 3) {
                this.$refs.editChart[index].setData(chartItem, tableData,
                  this.filter.panelId, this.filter);
              } else if (chartItem.type === 1 || chartItem.type === 2 || chartItem.type === 4) {
                if (series.length && chartItem.type === 4) {
                  series.push(sumData);
                }
                this.$refs.editChart[index].setData(chartItem, series,
                  this.filter.panelId, this.filter);
              }
            } else {
              const type = chartItem.type;
              if (type === 3) {
                this.$refs.editChart[index].setData(chartItem, [], this.filter.panelId,
                this.filter);
              } else if (type === 1 || type === 2 || chartItem.type === 4) {
                this.$refs.editChart[index].setData(chartItem, [], this.filter.panelId,
                this.filter);
              }
            }
          }).catch((error) => {
            if (error) {
              this.$Message.warning({
                content: '请稍后刷新',
                duration: 3,
              });
            }
          });
        });
      }
    },
    getNewTime(time, num) {
      const date = new Date(time);
      const newDate = new Date(parseInt(date.getTime(), 10) + num);
      return bus.timeFormate(newDate, 'yyyy/MM/dd-hh:mm:ss');
    },
    // 刷新列表中的一个图表
    refreshChart(chartId) {
      this.dataList.forEach((item, index) => {
        if (item.id === chartId) {
          this.getChartData(item, index, 'refresh');
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
  },
  mounted() {
  },
  beforeDestroy() {
  },
};

</script>
