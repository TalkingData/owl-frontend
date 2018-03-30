<style lang="scss">
@import './queue.scss'

</style>
<template>
  <div class="queue-status">
    <div class="clearfix mb-10">
      <div class="float-left">
        <Button :disabled="!disableObj.isRemove" type="primary">清除队列</Button>
        <!-- <Button type="primary" icon="plus" @click="createData">添加队列</Button> -->
      </div>
    </div>
    <div class="table-list">
      <div class="box-content">
        <div ref="queueCHart" id="queueCHart"></div>
      </div>
    </div>
    <notice-card v-model="chartModal" 
    :top="top" 
    :left="left"
    title="告警操作"
    :is-mute="isMute"
    @on-cancel="chartModal = false"
    @on-clear="clearQueue"
    @on-confirm="muteTrigger"></notice-card>
  </div>
</template>
<script>
import highcharts from 'highcharts';
// import _ from 'lodash';
// import bus from '../../libs/bus';
import { getQuequeStatus, updateQueue } from '../../../models/service';
import noticeCard from './notice-card';

require('highcharts/modules/no-data-to-display')(highcharts);
require('highcharts-custom-events')(highcharts);
// require('dom-events')(highcharts);

export default {
  name: 'queue',
  components: {
    noticeCard,
  },
  props: {},
  data() {
    return {
      dataList: [{
        count: 3,
        id: 11,
        mute: true,
        name: 'App',
      }, {
        count: 0,
        id: 22,
        mute: false,
        name: 'OAM',
      }, {
        count: 5,
        id: 33,
        mute: false,
        name: 'TEST',
      }, {
        count: 10,
        id: 44,
        mute: false,
        name: 'GAME',
      }], // 列表
      selectedData: [], // 选中数据
      removeModal: false,
      deleteShowData: [],
      highchartStore: null,
      chartModal: false,
      top: 0,
      left: 0,
      isMute: false,
      queueInfo: {},
    };
  },
  methods: {
    // 获取数据
    getData() {
      getQuequeStatus().then((res) => {
        if (res.status === 200) {
          this.dataList = res.data.queues;
          const arr = this.dataList.map((item) => {
            const obj = {
              name: item.name,
              y: item.count,
              // x: item.name,
              color: this.getColor(item.mute),
              id: item.id,
            };
            return obj;
          });
          const series = [{
            name: '告警队列',
            data: arr,
          }];
          this.initChart('告警队列', series);
        }
      });
    },
    clearQueue() {
      const self = this;
      this.$Modal.confirm({
        title: '清空队列',
        content: `确定要对 ${this.queueInfo.name} 执行清空队列吗？`,
        onOk: () => {
          self.cleanConfirm();
        },
      });
    },
    cleanConfirm() {
      updateQueue({
        id: this.queueInfo.id,
        action: 'clean',
      }).then((res) => {
        if (res.status === 200) {
          this.$Message.success('清除成功');
          this.getData();
        } else {
          this.$Message.warning('清除失败');
        }
      });
    },
    // 设置队列
    muteTrigger(flag) {
      const self = this;
      const word = flag ? '关闭' : '开启';
      // false时,操作开启,true时,操作关闭
      this.$Modal.confirm({
        title: `${word}告警`,
        content: `确定${word}告警 ${this.queueInfo.name} 吗？`,
        onOk: () => {
          self.muteComfirm(flag);
        },
      });
    },
    muteComfirm(flag) {
      const params = {
        id: this.queueInfo.id,
      };
      params.action = flag ? 'unmute' : 'mute';
      const word = flag ? '关闭' : '开启';
      updateQueue(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success(`${word}成功`);
        } else {
          this.$Message.warning(`${word}失败`);
        }
        this.getData();
      });
    },
    // 清除队列
    removeData(obj) {
      if (obj === 'multiple') { // 清除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 清除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 删除队列确认
    deleteConfirm() {
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 展示详情
    showOperate(event, obj) {
      const queue = this.dataList.find(item => item.id === obj.id);
      this.queueInfo = queue;
      this.top = event.layerY;
      this.left = event.layerX;
      this.isMute = queue.mute;
      this.chartModal = true;
    },
    // 获取颜色值
    getColor(mute) {
      if (mute) {
        return '#7CB5EC';
      }
      return '#bbbec4';
    },
    setData() {
      const arr = this.dataList.map((item) => {
        const obj = {
          name: item.name,
          y: item.count,
          // x: item.name,
          color: this.getColor(item.mute),
          id: item.id,
        };
        return obj;
      });
      const series = [{
        name: '告警队列',
        data: arr,
      }];
      this.initChart('告警队列', series);
    },
    initChart(chartName, dataArg) {
      const self = this;
      highcharts.setOptions({
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
        // colors: ['#f7acbc', '#f05b72', '#cd9a5b', '#66ffff', '#ccFF66',
        //   '#1d953f', '#abc88b', '#769149', '#7f7522', '#9b95c9',
        //   '#f3715c', '#ea66a6', '#d1c7b7', '#9d9087', '#77787b',
        //   '#f58220', '#c37e00', '#918597', '#f26522', '#FF00FF',
        //   '#76624c', '#1b315e', '#2468a2', '#ca8687', '#bd6758',
        //   '#596032', '#5f5d46', '#00ae9d', '#70a19f', '#005344',
        //   '#d71345', '#7bbfea', '#76becc', '#b3424a', '#f47920',
        // ],
        chart: {
          renderTo: this.$refs.queueCHart,
          type: 'column',
        },
        credits: {
          enabled: false, // 不显示水印
        },
        title: {
          text: chartName,
          align: 'left',
        },
        xAxis: {
          type: 'category',
          labels: {
            rotation: -45,
            style: {
              fontSize: '13px',
              fontFamily: 'Verdana, sans-serif',
            },
          },
        },
        yAxis: {
          // gridLineColor: '#DCDCDC',
          min: 0,
          minRange: 1,
          title: {
            text: null,
          },
          // opposite: false,
        },
        // legend: {
        //   enabled: true,
        //   align: 'left',
        //   verticalAlign: 'bottom',
        //   y: 0,
        // },
        // rangeSelector: {
        //   inputEnabled: false,
        //   enabled: false,
        // },
        plotOptions: {
          series: {
            cursor: 'pointer',
            point: {
              events: {
                // eslint-disable-next-line
                contextmenu: function(event) {
                  self.showOperate(event, this);
                },
              },
            },
            minPointLength: 5,
            // maxPointWidth: 20,
          },
        },
        tooltip: { // 弹出
          shared: true,
          // eslint-disable-next-line
          formatter: function() {
            let str = '';
            for (let i = 0; i < this.points.length; i += 1) {
              const point = this.points[i];
              // console.log(point);
              str += `<span style="font-weight: bold;">
              ${point.key}</span>`;
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
      this.highchartStore = new highcharts.Chart(params);
    },
    operate() {
    },
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
        };
      }
      return {
        isRemove: false,
      };
    },
  },
  mounted() {
    this.getData();
    // this.setData();
  },
  beforeDestroy() {
  },
};

</script>
