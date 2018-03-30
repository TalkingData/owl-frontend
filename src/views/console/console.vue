<style lang="scss">
  @import './console.scss'
</style>
<template>
  <div class="main-container console">
    <div class="tops clearfix">
      <div class="top-l">
        <div :class="[isConsole ? 'board boardCheck' : 'board']" @click="showConsole">
          <p>主控台</p>
        </div>
        <div v-for="(item, index) in favorList" :class="[item.fStatus ? 'board boardCheck':'board']">
          <p :title="item.name" @click="showBoard(index, item.id)">{{ item.name }}</p><span @click="close(index, item.id)">×</span>
        </div>
        <span v-if="isAdd" class="setBoard" @click="addBoard"></span>
      </div>
      <div class="top-r clearfix">
        <div class='time-l'>
          <calendar-select></calendar-select>
        </div>
        <!-- 刷新 -->
        <div class='ref-r'>
          <span>自动刷新&nbsp;</span>
          <Select style="width:100px;" v-model="rTime" @on-change="setRtime">
            <Option v-for="item in refreshList" :key="item.value" :value="item.value">{{item.label}}</Option>
          </Select>
          <span @click="reset_data" class="top-r-upload">
            <Icon size="18" color="#5697f1" type="refresh"></Icon>
          </span>
        </div>
      </div>
    </div>
    <div :class="[isShow ? 'fixedIcon box' : 'fixedIcon']">
      <span class="icon" @click="showBox"></span>
      <div class="showBox">
        <Core ref="coreRight" type="board"></Core>
      </div>
    </div>
    <div v-if="isConsole" class="console-body">
      <div class="console-body-up">
        <Row>
          <Col span="8" style="padding-right: 20px;">
            <circle-panel ref="hostStatus" :chart-id="'hostStatus'">
              设备状态分布
            </circle-panel>
          </Col>
          <Col span="8" style="padding-right: 20px;">
            <circle-panel ref="alarmLevel" :chart-id="'alarmLevel'">
              告警级别分布
            </circle-panel>
          </Col>
          <Col span="8" style="padding-right: 20px;">
            <circle-panel ref="alarmStatus" :chart-id="'alarmStatus'">
              告警状态分布
            </circle-panel>
          </Col>
        </Row>
      </div>
      <!-- 首页趋势线 -->
      <div class="console-body-down clearfix">
        <div class="downs">
          <line-panel ref="trendLine" :chart-id="'trendLine'"></line-panel>
        </div>
      </div>
    </div>
    <!-- 看板详情图表 -->
    <div v-else class="chart-body">
      <chart-view-list ref="view" @on-remove-chart-list="remove_chart"></chart-view-list>
    </div>
    <!--添加、创建看板-->
    <div class="add-components">
      <board-add ref="addBoardModal"></board-add>
      <!--编辑图表信息，添加图表 chartdata-->
      <chartAdd ref="addChartModal"></chartAdd>
    </div>
  </div>
</template>
<script>
// import Cookies from 'js-cookie';
import bus from '../../libs/bus';
import {
  getPanels,
  closeFavor,
  getHostStatus,
  getEventCount,
  getEvevtStatus,
  getEvevtPanel,
  getChartInfo,
  updatePanels,
} from '../../models/service';
import calendarSelect from '../../components/calendar-select';
import circlePanel from '../../components/console/circle-panel';
import linePanel from '../../components/console/line-panel';
import chartViewList from '../../components/console/chart-view-list';
import boardAdd from '../../components/board/board-add';
import Core from '../../components/board/core';
import chartAdd from '../../components/board/chart-add';

export default {
  name: 'console',
  components: {
    calendarSelect,
    circlePanel,
    linePanel,
    chartViewList,
    boardAdd,
    Core,
    chartAdd,
  },
  data() {
    return {
      ispop: false, // 刷新操作是前端在到达指定时刻后发送请求还是后台处理前端时刻监听
      refreshT: 0,
      rTime: 0,
      refreshList: [{
        value: 0,
        label: '从不',
      }, {
        value: 30 * 1000,
        label: '30秒',
      }, {
        value: 60 * 1000,
        label: '60秒',
      }, {
        value: 300 * 1000,
        label: '5分',
      }, {
        value: 900 * 1000,
        label: '15分',
      }, {
        value: 1800 * 1000,
        label: '30分',
      }],
      devstatus: {
        state: ['正常', '故障', '未知'],
        set: [],
        title: '设备状态',
      },
      alarmstate: {
        state: ['严重', '较严重', '注意'],
        set: [],
        title: '告警',
      },
      alarmstatus: {
        state: ['活跃', '已知悉', '已关闭'],
        set: [],
        title: '告警状态',
      },
      trend: {
        period: [],
        state: ['严重', '较严重', '注意'],
        set: [],
      },
      isChecked: [],
      isShow: false,
      addboardFlag: false,
      setdata: false,
      favorList: [],
      fState: [],
      // 看板数量
      isConsole: true,
      isAdd: true,
      isCalendar: false,
      editdata: false,
      timer: null,
      // 记录日历时间
      address: ['', ''],
      static: '',
      boardUrl: 'panels',
      boardInfo: {
        index: '',
        id: '',
      },
      setPanels: [],
    };
  },
  methods: {
    refreshScroll() {
      window.scrollTo(0, 0);
    },
    // 全局刷新，重置时间和日历组件时间
    reset_data() {
      localStorage.removeItem('datestart1');
      localStorage.removeItem('dateend1');
      bus.getDefaultDate();
      this.$nextTick(() => {
        this.refresh_data();
      });
    },
    // ajax方法获取数据
    refresh_data() {
      if (this.isConsole) {
        this.getHstatus();
        this.getAstate();
        this.getAstatus();
        this.getAtrend();
      } else {
        this.$refs.view.$emit('set_timer', this.rTime, this.boardInfo.id);
      }
    },
    // 响应刷新周期
    setRtime() {
      if (this.isConsole) {
        if (this.rTime === 0) {
          clearInterval(this.timer);
          this.refresh_data();
        } else {
          clearInterval(this.timer);
          this.timer = setInterval(this.reset_data, this.rTime);
        }
        this.$refs.view.$emit('clear_timer');
      } else {
        this.$nextTick(() => {
          this.$refs.view.$emit('set_timer', this.rTime, this.boardInfo.id);
        });
      }
    },
    // 获取设备状态,设备状态分布 copy
    getHstatus() {
      getHostStatus().then((response) => {
        if (response.data.code === 200) {
          this.devstatus.set = [
            { y: response.data.normal, name: '正常' },
            { y: response.data.failed, name: '故障' },
            { y: response.data.pending, name: '未知' },
          ];
          this.$refs.hostStatus.$emit('set_data', this.devstatus);
        }
      });
    },
    // 获取报警分布 copy
    getAstate() {
      // 从this.address获取开始结束时间参数
      const params = this.address[0] ? { start: this.address[0], end: this.address[1] } : {};
      getEventCount(params).then((response) => {
        if (response.data.code === 200) {
          this.alarmstate.set = [
            { y: response.data.count.high, name: '严重' },
            { y: response.data.count.middle, name: '较严重' },
            { y: response.data.count.low, name: '注意' },
          ];
          this.$refs.alarmLevel.$emit('set_data', this.alarmstate);
        }
      });
    },
    // 获取报警状态 copy
    getAstatus() {
      // 从this.address获取开始结束时间参数
      const params = this.address[0] ? { start: this.address[0], end: this.address[1] } : {};
      getEvevtStatus(params).then((response) => {
        if (response.data.code === 200) {
          this.alarmstatus.set = [
            { y: response.data.active, name: '活跃' },
            { y: response.data.awared, name: '已知悉' },
            { y: response.data.closed, name: '已关闭' },
          ];
          this.$refs.alarmStatus.$emit('set_data', this.alarmstatus);
        }
      });
    },
    // 获取报警趋势分布 copy
    getAtrend() {
      // 从this.address获取开始结束时间参数
      const params = this.address[0] ? { start: this.address[0], end: this.address[1] } : {};
      getEvevtPanel(params).then((response) => {
        if (response.data.code === 200) {
          this.$refs.trendLine.$emit('set_data', response.data.panel);
        }
      });
    },
    // 显示favor看板  copy
    getFavor() {
      getPanels({
        favor: 1,
      }).then((response) => {
        if (response.data.code === 200) {
          this.favorList = response.data.panels.map((item) => {
            const obj = item;
            obj.fStatus = false;
            return obj;
          });
          this.judge_favor();
        }
      });
    },
    // 显示侧边栏
    showBox() {
      if (this.isShow) {
        this.isShow = false;
        this.$refs.coreRight.$emit('clearData', this.setPanels);
      } else {
        this.isShow = true;
        this.$refs.coreRight.$emit('chartData', this.setPanels);
      }
    },
    // 关闭看板
    close(index, id) {
      closeFavor({
        favorId: id,
      }).then((response) => {
        if (response.data.code === 200) {
          this.favorList.splice(index, 1);
          // 右侧弹出框,core
          bus.$emit('refreshFavor', this.favorList);
          if (this.favorList.length === 0) {
            this.isConsole = true;
          } else if (this.isConsole) {
            this.favorList.forEach((item) => {
              const obj = item;
              obj.fStatus = false;
            });
          } else {
            for (let i = 0; i < this.favorList.length; i += 1) {
              if (i === this.favorList.length - 1) {
                this.favorList[i].fStatus = true;
                // chart-view-list
                bus.$emit('draw_echarts', this.favorList[i].id);
              } else {
                this.favorList[i].fStatus = false;
              }
            }
          }
          if (this.favorList.length === 4) {
            this.isAdd = false;
          } else {
            this.isAdd = true;
          }
        }
      });
    },
    // 添加，创建看板
    addBoard() {
      if (this.favorList.length === 4) {
        this.isAdd = false;
      } else {
        this.isAdd = true;
      }
      clearInterval(this.timer);
      this.addboardFlag = true;
      // this.$refs.paging8.$emit('choice');
      // 弹出增加看板框
      this.$refs.addBoardModal.$emit('on-add-board', 'board');
    },
    // 显示主控台
    showConsole() {
      this.isConsole = true;
      this.favorList.forEach((item) => {
        const obj = item;
        obj.fStatus = false;
      });
      this.setRtime();
      this.refreshScroll();
    },
    // 点击看板，获取相应看板数据显示看板
    showBoard(index, id) {
      for (let i = 0; i < this.favorList.length; i += 1) {
        this.favorList[i].fStatus = i === index;
      }
      this.boardInfo.index = index;
      this.boardInfo.id = id;
      this.isConsole = false;
      clearInterval(this.timer);
      this.setRtime();
      this.refreshScroll();
    },
    // 弹出日历组件
    popCalendar() {
      this.isCalendar = !this.isCalendar;
      if (this.isCalendar) {
        const value1 = JSON.parse(localStorage.getItem('datestart1'));
        const value2 = JSON.parse(localStorage.getItem('dateend1'));
        const value3 = JSON.parse(localStorage.getItem('datestart'));
        const value4 = JSON.parse(localStorage.getItem('dateend'));
        if (value1 == null && value2 == null) {
          this.$refs.calendar.$emit('get_old', value3, value4);
        } else {
          this.$refs.calendar.$emit('get_old', value1, value2);
        }
      }
      if (this.isConsole === false) {
        this.$broadcast('getInfo', this.boardInfo);
      }
    },
    // 判断已显示的看板数量及当前看板
    judge_favor() {
      if (this.favorList.length === 4) {
        this.isAdd = false;
      } else {
        this.isAdd = true;
      }
    },
    // 在查看看板的情况下，判断删除的看板是否是当前看板，是则返回主控台
    judge_state(id) {
      for (let i = 0; i < this.favorList.length; i += 1) {
        const tmp = this.favorList[i];
        if (tmp.id === id) {
          this.isAdd = true;
          const tm = this.favorList[i].fStatus;
          if (tm) this.isConsole = true;
          this.favorList.splice(i, 1);
        }
      }
    },
    // 刷新图表
    re_chart(id) {
      // 获取该id下chart的相关信息
      getChartInfo({
        chartId: id,
      }).then((response) => {
        if (response.data.code === 200) {
          bus.$emit('refresh_chart', response.data.chart, id);
        } else {
          this.$Message.error(response.data.message);
        }
      });
    },
    // --------以下为监听事件方法---------------------------------------
    // 关闭添加创建看板
    add_close() {
      this.addboardFlag = false;
      this.setdata = false;
    },
    edit_chart() {
      this.editdata = true;
    },
    close_set() {
      this.editdata = false;
    },
    // 获取移除chart的请求
    remove_chart(chartId, panelId) {
      for (let i = 0; i < this.setPanels.length; i += 1) {
        if (this.setPanels[i].id === panelId) {
          for (let y = 0; y < this.setPanels[i].charts.length; y += 1) {
            if (this.setPanels[i].charts[y].id === chartId) {
              this.setPanels[i].charts.splice(y, 1);
              updatePanels(this.setPanels[i]).then(() => {
                // if (response.data.code === 200) {
                //   for (let j = 0; j < chart.$children.length; j += 1) {
                //     if (chart.$children[j].id === id) {
                //       chart.$children[j].$remove();
                //     }
                //   }
                // }
              });
            }
          }
        }
      }
    },
    // 编辑图表信息,打开编辑弹窗
    edit_data(id) {
      // 获取该id下chart的相关信息
      getChartInfo({
        chartId: id,
      }).then((response) => {
        if (response.data.code === 200) {
          // 弹出编辑tag的窗口, 在chart-add中展示数据
          this.$refs.addChartModal.$emit('on-edit-chart-data', response.data.chart);
        } else {
          this.$Message.warning(response.data.message);
        }
      });
    },
  },
  mounted() {
    // 更新已有图表, 编辑图表信息
    bus.$on('update_relate', (obj) => {
      this.re_chart(obj.id);
      // this.$set('setdata', false);
    });
    // 刷新图表信息
    bus.$on('update_data', (id) => {
      this.re_chart(id);
    });
    // 编辑图表，编辑图表信息,打开编辑弹窗
    bus.$on('on-edit-chart-move', (id) => {
      this.edit_data(id);
    });
    // set_calendar 原方法
    bus.$on('on-date-change', (time) => {
      this.address = time;
      this.refresh_data();
      if (this.isConsole === false) {
        this.showBoard(this.boardInfo.index, this.boardInfo.id);
        bus.$emit('getInfo', this.boardInfo);
      }
    });
    // 设置展示的看板,从board-add中进行操作
    bus.$on('set_favor', (obj) => {
      this.favorList.push(obj);
      bus.$emit('draw_echarts', obj.id);
      this.isConsole = false;
      this.judge_favor();
      this.favorList.forEach((item, index) => {
        const favorItem = item;
        if (item.id === obj.id) {
          favorItem.fStatus = true;
          this.showBoard(index, obj.id);
        } else {
          favorItem.fStatus = false;
        }
      });
      // this.favorList[this.favorList.length - 1].fStatus = true;
      // this.$set(this.fState, this.favorList.length - 1, true);
    });
    // 第一次加载时装载的数据请求--时间段
    this.getFavor();
    if (bus.selectDate) {
      this.address = bus.selectDate;
    }
    this.refresh_data();
    // 获取panels列表
    getPanels().then((response) => {
      if (response.data.code === 200) {
        this.setPanels = response.data.panels;
      }
    });
    // 更新favor视窗,监听core中删除看板事件
    bus.$on('reload_favor', (id) => {
      this.judge_state(id);
    });
  },
  computed: {
    // rTime() {
    //   return this.refreshT * 1000;
    // },
  },
  beforeDestroy() {
    bus.$off('update_relate');
    bus.$off('update_data');
    bus.$off('set_favor');
    bus.$off('on-date-change');
    bus.$off('reload_favor');
    bus.$off('on-edit-chart-move');
  },
};

</script>
