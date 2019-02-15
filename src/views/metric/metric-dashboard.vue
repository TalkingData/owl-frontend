<style lang="scss">
  @import './metric-dashboard.scss';
</style>
<template>
  <div class="main-container metric-dashboard">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-left">
          <span class="common-detail-top-title">指标预览</span>
        </div>
        <div class="float-right mr-10">
          <calendar-select @on-date-change="dateChange" placement="bottom-end"></calendar-select>
        </div>
      </div>
      <div class="table-list">
        <div class="box-content">
          <Row class="chart-das" :gutter="10">
            <Col span="10">
              <div>
                <metric-set ref="metricSet" @on-view-chart="getChartParam"></metric-set>
              </div>
            </Col>
            <Col span="14">
              <Row class="border-area" v-show="chartCount === 'single'">
                <div class="chartBox">
                  <line-chart-block 
                    :show-setting="false"
                    ref="editChartSingle" 
                    @on-refresh-data="refreshChart"
                    @on-remove-chart-block="removeChart" 
                    @on-edit-chart-block="editData"
                    ></line-chart-block>
                </div>
              </Row>
              <Row class="border-area" v-show="chartCount === 'multiple'">
                <div class="chartBoxMul" v-for="(item, index) in lineList">
                  <line-chart-block 
                    :show-setting="false"
                    ref="editChartMultiple" 
                    @on-refresh-data="refreshChart"
                    @on-remove-chart-block="removeChart" 
                    @on-edit-chart-block="editData"
                    ></line-chart-block>
                </div>
              </Row>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import {
  getQueryChart,
} from '../../models/service';
import metricSet from '../../components/metric/metric-set';
import lineChartBlock from '../../components/charts/line-chart-block';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'monitorHost',
  components: {
    metricSet,
    lineChartBlock,
    calendarSelect,
  },
  props: {
  },
  data() {
    return {
      filter: {
        start_time: '',
        end_time: '',
      },
      productId: 0,
      total: 0, // 总数
      selectedData: null, // 选中数据
      searchName: '', // 搜索名称
      showTagModal: false,
      tagSet: null, // 根据你metric获取的tags信息
      metricInfo: {}, // 保存参数信息
      chartCount: 'single', // multiple
      lineList: [], // 线列表
    };
  },
  computed: {
  },
  methods: {
    // 获取图表信息
    getChartParam(params, chartCount) {
      this.chartCount = chartCount;
      this.metricInfo = params;
      if (this.chartCount === 'single') {
        this.$refs.editChartSingle.showLoad();
      } else if (this.chartCount === 'multiple') {
        if (this.lineList.length > 0) {
          this.$refs.editChartMultiple.forEach((item) => {
            item.showLoad();
          });
        }
      }
      getQueryChart({
        metric: params.metric,
        tags: params.tags,
        start: this.filter.start_time,
        end: this.filter.end_time,
      }).then((res) => {
        this.$refs.metricSet.loading = false;
        if (res.status === 200 && res.data.code === 200) {
          this.lineList = res.data.data;
          // 如果只有一组数据，强制显示一条
          if (res.data.data.length === 1) {
            this.chartCount = 'single';
          }
          this.getChartData(res, params);
        } else {
          this.chartCount = 'single';
          // 图表不可保存
          this.$refs.metricSet.saveDisabled = true;
          this.$refs.metricSet.isSave = false;
          this.$Message.warning('没有数据');
          this.chartCount = 'single';
          this.$nextTick(() => {
            this.$refs.editChartSingle.setData(params, [], 0, this.filter);
          });
        }
      });
    },
    refreshChart() {},
    removeChart() {},
    editData() {},
    // 获取一个图表具体数据
    getChartData(response, params) {
      const chartItem = Object.assign({}, params);
      chartItem.title = params.metric || '预览图';
      const series = [];
      // 一个图表
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
      // 将获取的数据运用于创建多个图表备用
      this.$refs.metricSet.setSeries(response.data.data);
      if (this.chartCount === 'single') {
        this.setSize(chartItem.span, 0);
        const filterParams = Object.assign({}, this.filter);
        filterParams.chartCount = 'single';
        this.$nextTick(() => {
          this.$refs.editChartSingle.setData(chartItem, series, 0, filterParams);
        });
      } else if (this.chartCount === 'multiple') {
        const filterParams = Object.assign({}, this.filter);
        filterParams.chartCount = 'multiple';
        this.setSize(chartItem.span, 'all');
        this.$nextTick(() => {
          series.forEach((serieData, index) => {
            // 设置每个图表名称
            const chartInfoParams = Object.assign({}, chartItem);
            chartInfoParams.title = serieData.name;
            this.$refs.editChartMultiple[index]
            .setData(chartInfoParams, [serieData], 0, filterParams);
          });
        });
      }
    },
    // 查看指标确认
    viewConfirm() {
      this.showTagModal = false;
    },
    // 取消查看
    viewCancel() {
      this.showTagModal = false;
      this.selectedData = {};
    },
    // 查看详情
    viewDetail(item) {
      this.selectedData = item;
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
    }, 300),
    // 刷新
    reload() {
      this.getChartParam(this.metricInfo, this.chartCount);
    },
    // 滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 设置图表的宽度
    setSize(size, index) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        if (index === 0) {
          chartBox[index].style.width = `${(size / 12) * 100}%`;
        } else {
          const chartBoxMul = document.getElementsByClassName('chartBoxMul');
          Array.prototype.slice.call(chartBoxMul).forEach((item) => {
            const obj = item;
            obj.style.width = `${(size / 12) * 100}%`;
          });
        }
      });
    },
    // 获取默认时间
    getInit() {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      start.setSeconds(0);
      end.setSeconds(59);
      this.filter.start_time = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.end_time = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm:ss');
    },
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.getChartParam(this.metricInfo, this.chartCount);
    },
  },
  mounted() {
    if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getInit();
    // 修改时间
    // bus.$on('on-date-change', (time) => {
    //   // this.filter.start_time = `${time[0].replace(/-/g, '/')}-00:00:00`;
    //   // this.filter.end_time = `${time[1].replace(/-/g, '/')}-23:59:59`;
    //   this.filter.start_time = `${time[0]}:00`;
    //   this.filter.end_time = `${time[1]}:59`;
    //   this.getChartParam(this.metricInfo, this.chartCount);
    // });
  },
  beforeDestroy() {
    // bus.$off('on-date-change');
  },
};

</script>
