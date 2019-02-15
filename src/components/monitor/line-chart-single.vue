<style lang="scss">
  @import './line-chart-single.scss';
</style>
<template>
  <div class="line-chart-single" id="lineList">
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
      <div class="chartBox" v-if="dataList.length > 0">
        <line-chart-item 
        ref="editChart" 
        :showSetting="false"
        @on-refresh-data="refreshChart"></line-chart-item>
      </div>
      <Row v-if="dataList.length === 0" style="text-align: center" class="p-10">暂无图表数据</Row>
    </Row>
  </div>
</template>
<script>
import axios from 'axios';
import bus from '../../libs/bus';
import { getQueryChart } from '../../models/service';
import lineChartItem from './line-chart-item';
import calendarSelect from '../page/calendar-select';

export default {
  name: 'lineChartSingle',
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
    // 获取metric详情数据,获取host下所有metric列表
    getData() {
      // 刷新时,增加loading状态
      if (this.dataList.length > 0) {
        this.$refs.editChart.showLoad();
      }
      this.dataSetFirst(this.dataList);
    },
    // 刷新
    reload() {
      this.$refs.calendar.reload();
    },
    // arr: 该panel下图表list,生成该看板下所有图表
    dataSetFirst(arr) {
      this.dataCount = 0;
      if (arr.length) {
        this.getChartData(arr);
      }
    },
    // 获取一个图表具体数据,图表信息，图表位置index
    getChartData(arrList) {
      const arr = arrList;
      const chartItem = {
        name: '单图展示',
      };
      // 没有数据的设置提示信息暂无数据
      this.$nextTick(() => {
        // 设置请求组
        let axiosArr = [];
        axiosArr = arr.map((ele) => {
          const eleItem = ele;
          const tag = eleItem.tags ? `host=${this.hostInfo.hostname},${eleItem.tags}` :
          `host=${this.hostInfo.hostname}`;
          return getQueryChart({
            metric: eleItem.metric,
            tags: tag,
            start: this.filter.start_time,
            end: this.filter.end_time,
          });
        });
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
              }
            });
            this.$refs.editChart.setData(chartItem, series, this.filter);
          } else {
            this.$refs.editChart.setData(chartItem, [], this.filter);
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
    // 修改时间
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.filter.load = 'refresh';
      this.getData(this.filter);
    },
  },
  mounted() {
  },
  beforeDestroy() {
  },
};
</script>
