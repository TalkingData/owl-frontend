<template>
  <div class="calendar-select">
    <div class="choose-date">
      <Date-picker 
        class="data-picker-module"
        :open="date.dateOpen"
        :options="date.datePickerOptions"
        :value="date.curDate"
        confirm
        type="datetimerange"
        format="yyyy-MM-dd HH:mm:ss"
        @on-change="dateChange"
        @on-clear="dateClear"
        @on-ok="dateConfirm"
        placement="bottom-end">
        <a href="javascript:;" @click="dateOpen">
          <Icon class="icon-btn calendar-icon" type="ios-calendar-outline"></Icon>
            <span class="cur-date">{{date.oVal}}</span>
          <template>
          </template>
          <Icon class="icon-btn" type="ios-arrow-down"></Icon>
        </a>
      </Date-picker>
    </div>
  </div>
</template>
<script>
import bus from '../libs/bus';

export default {
  name: 'calendarSelect',
  data() {
    return {
      date: {
        dateOpen: false,
        // 选择的日期显示字样
        oVal: this.formatDate(bus.selectDate),
        // 存储日期，用于取消反向赋值
        oldDate: bus.selectDate,
        // 当前选择日期数组
        curDate: bus.selectDate,
        // 日历相关配置
        datePickerOptions: {
          shortcuts: [{
            text: '今日',
            value() {
              const end = new Date();
              const start = new Date();
              start.setStart();
              end.setEnd();
              return [start, end];
            },
          }, {
            text: '昨日',
            value() {
              const start = new Date();
              start.setTime(start.getTime() - (3600 * 1000 * 24 * 1));
              const end = start;
              start.setStart();
              end.setEnd();
              return [start, end];
            },
          }, {
            text: '近7天',
            value() {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - (3600 * 1000 * 24 * 7));
              start.setStart();
              end.setEnd();
              return [start, end];
            },
          }, {
            text: '近30日',
            value() {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - (3600 * 1000 * 24 * 30));
              start.setStart();
              end.setEnd();
              return [start, end];
            },
          }, {
            text: '近一年',
            value() {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - (3600 * 1000 * 24 * 365));
              start.setStart();
              end.setEnd();
              return [start, end];
            },
          }],
        },
      },
      confirmDate: [],
    };
  },
  computed: {
  },
  watch: {
  },
  mounted() {
  },
  beforeDestroy() {

  },
  methods: {
    // 打开选择日期
    dateOpen() {
      this.date.dateOpen = !this.date.dateOpen;
    },
    // 选择日期变化
    dateChange(date) {
      const oDate = date[0] ? date : this.date.oldDate;
      this.date.oVal = this.formatDate(oDate);
      this.date.curDate = oDate;
    },
    // 取消选择日期
    dateClear() {
      this.date.dateOpen = false;
      this.date.oVal = this.formatDate(this.date.oldDate);
    },
    // 确定日期
    dateConfirm() {
      this.date.dateOpen = false;
      this.date.oldDate = this.date.curDate;
      if (JSON.stringify(this.confirmDate) === JSON.stringify(this.date.curDate)) return;
      this.confirmDate = this.date.curDate;
      const selectDate = this.date.curDate;
      // eslint-disable-next-line
      localStorage.setItem('calendar_select_date', JSON.stringify(selectDate));
      bus.selectDate = this.confirmDate;
      bus.$emit('on-date-change', bus.selectDate);
    },
    formatDate(dateArr) {
      if (dateArr.join) {
        return dateArr.join(' ~ ');
      }
      return dateArr;
    },
  },
};
</script>
