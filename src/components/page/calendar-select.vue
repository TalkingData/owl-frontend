<style lang="scss">
@import './calendar-select.scss'

</style>
<template>
  <div class="calendar-select" :style="fontStyle">
    <div class="choose-date">
      <DatePicker v-clickoutside="outside"
        class="data-picker-module"
        :open="dateOpenFlag"
        :options="date.datePickerOptions"
        :value="date.currentDate"
        confirm
        split-panels
        type="datetimerange"
        format="yyyy/MM/dd-HH:mm"
        @on-change="dateChange"
        @on-clear="dateClear"
        @on-ok="dateConfirm"
        :placement="placement">
        <a href="javascript:;" @click="openDate">
          <Icon class="icon-btn calendar-icon" type="ios-calendar-outline"></Icon>
            <span class="cur-date">{{date.showDateValue}}</span>
          <template>
          </template>
          <Icon class="icon-btn" type="ios-arrow-down"></Icon>
        </a>
      </DatePicker>
    </div>
    <div class="refresh-area" v-if="refresh">
      刷新周期
      <Select style="width: 100px;" v-model="interval" @on-change="selectInterval">
        <Option v-for="item in intervalList" 
        :value="item.value" 
        :label="item.name"
        :key="item.value">{{item.name}}</Option>
      </Select>
    </div>
  </div>
</template>
<script>
import bus from '../../libs/bus';
import clickoutside from '../../directives/clickoutside';

export default {
  name: 'calendarSelect',
  directives: {
    clickoutside,
  },
  props: {
    placement: {
      type: String,
      default: 'bottom-end',
    },
    size: {
      type: Number,
      default: 14,
    },
    refresh: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      datePast: '',
      dateOpenFlag: false, // 展示日期选择框
      date: {
        // 选择的日期显示字样
        showDateValue: '',
        // 当前选择日期数组
        currentDate: [],
        // 日历相关配置
        datePickerOptions: {
          shortcuts: [{
            text: '近1小时',
            value() {
              const end = new Date();
              const start = new Date();
              start.setHours(start.getHours() - 1);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '近4小时',
            value() {
              const end = new Date();
              const start = new Date();
              start.setHours(start.getHours() - 4);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '近1日',
            value() {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 1);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '昨日',
            value() {
              const start = new Date();
              const end = new Date();
              start.setDate(start.getDate() - 1);
              end.setDate(end.getDate() - 1);
              start.setStart();
              end.setEnd();
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '近7日',
            value() {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 7);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '近1月',
            value() {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 30);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '本月',
            value() {
              const end = new Date();
              const start = new Date();
              start.setDate(1);
              start.setHours(0);
              start.setMinutes(0);
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }, {
            text: '上月',
            value() {
              const end = new Date();
              const start = new Date();
              start.setDate(1);
              start.setMonth(start.getMonth() - 1);
              end.setDate(0);
              start.setStart();
              end.setEnd();
              return [start, end];
            },
            onClick: () => {
              this.dateOpenFlag = false;
              setTimeout(() => {
                this.dateConfirm();
              }, 100);
            },
          }],
        },
      },
      confirmDate: [], // 存储日期，用于取消反向赋值
      selectDate: [],
      intervalList: [{
        value: 0,
        name: '从不',
      }, {
        value: 60,
        name: '1分钟',
      }, {
        value: 180,
        name: '3分钟',
      }, {
        value: 300,
        name: '5分钟',
      }, {
        value: 600,
        name: '10分钟',
      }],
      interval: 0,
      intervalTimer: null,
    };
  },
  methods: {
    // 打开选择日期
    openDate() {
      this.dateOpenFlag = !this.dateOpenFlag;
      // 当展开选择器时,将面板时间和选择时间同步
      if (this.dateOpenFlag) {
        this.date.currentDate = this.confirmDate;
      }
    },
    outside() {
      this.dateClear();
    },
    // 选择日期变化
    dateChange(date) {
      const oDate = date[0] ? date : this.confirmDate;
      this.date.showDateValue = this.formatDate(oDate);
      this.date.currentDate = oDate;
    },
    // 取消选择日期
    dateClear() {
      this.dateOpenFlag = false;
      this.date.showDateValue = this.formatDate(this.confirmDate);
    },
    // 确定日期
    dateConfirm() {
      this.dateOpenFlag = false;
      if (JSON.stringify(this.confirmDate) === JSON.stringify(this.date.currentDate)) return;
      this.confirmDate = this.date.currentDate;
      this.date.showDateValue = this.formatDate(this.confirmDate);
      this.$emit('on-date-change', this.confirmDate);
    },
    selectInterval(val) {
      if (val) {
        const start = new Date(this.confirmDate[1]);
        const now = new Date();
        const interval = Math.floor((now.getTime() - start.getTime()) / 1000);
        if (interval >= 60) {
          this.getIntervalData(interval);
        }
        this.intervalTimer = setInterval(() => {
          this.getIntervalData(this.interval);
        }, val * 1000);
      } else {
        clearInterval(this.intervalTimer);
      }
    },
    formatDate(dateArr) {
      if (dateArr.join) {
        return dateArr.join(' ~ ');
      }
      return dateArr;
    },
    // 获取初始化时间，默认最近1小时
    getDefaultDate() {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      const startTime = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm');
      const endTime = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm');
      this.confirmDate = [startTime, endTime];
      this.date.currentDate = [startTime, endTime];
      this.date.showDateValue = `${startTime} ~ ${endTime}`;
    },
    test() {
      this.getIntervalData(60);
    },
    getIntervalData(interval) {
      const start = new Date(this.confirmDate[0]);
      const end = new Date(this.confirmDate[1]);
      start.setSeconds(start.getSeconds() + interval);
      end.setSeconds(end.getSeconds() + interval);
      const startTime = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm');
      const endTime = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm');
      this.confirmDate = [startTime, endTime];
      this.date.currentDate = [startTime, endTime];
      this.date.showDateValue = `${startTime} ~ ${endTime}`;
      this.$emit('on-date-change', this.confirmDate);
    },
    reload() {
      const start = new Date(this.confirmDate[1]);
      const now = new Date();
      const interval = Math.floor((now.getTime() - start.getTime()) / 1000);
      if (interval >= 60) {
        this.getIntervalData(interval);
      } else {
        this.$Message.info({
          duration: 3,
          content: '最小刷新间隔为1分钟，请稍后刷新',
        });
      }
    },
    // 需要外部设置默认时间的接口
    initTime(obj) {
      this.close();
      if (obj) {
        // 设置开始时间
        const startTime = obj.start.slice(0, 16);
        // 设置结束时间
        const endTime = obj.end.slice(0, 16);
        this.confirmDate = [startTime, endTime];
        this.date.currentDate = [startTime, endTime];
        this.date.showDateValue = `${startTime} ~ ${endTime}`;
      } else {
        this.getDefaultDate();
      }
    },
    close() {
      this.interval = 0;
      clearInterval(this.intervalTimer);
    },
  },
  computed: {
    fontStyle() {
      return `font-size: ${this.size}px`;
    },
  },
  watch: {
  },
  mounted() {
    this.getDefaultDate();
  },
  beforeDestroy() {
    this.close();
  },
};
</script>
