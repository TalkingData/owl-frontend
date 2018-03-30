<style lang="scss">
  @import './date-select.scss'
</style>
<template>
  <div class="date-select">
    <div class="choose-date">
      <Date-picker 
      v-model="timeSets.startTimePick" 
      :editable="false"
      :clearable="false" 
      :confirm="false"
      type="datetime" 
      format="yyyy/MM/dd-HH:mm" 
      placeholder="选择开始日期" 
      placement="bottom-start" 
      @on-change="getStartTime" 
      :options="dateOptionStart"></Date-picker>
      <span class="connect-word">~</span>
      <Date-picker 
      v-model="timeSets.endTimePick" 
      :editable="false" 
      :clearable="false" 
      :confirm="false"
      type="datetime" 
      format="yyyy/MM/dd-HH:mm" 
      placeholder="选择结束日期" 
      placement="bottom-start" 
      :options="dateOptionEnd" 
      @on-change="getEndTime"></Date-picker>
      <Button type="primary" @click="quickSearch('search')">查询</Button>
      <Dropdown @on-click="quickSearch" style="margin-left: 10px;" placement="bottom-end">
        <a href="javascript:;">
          快捷搜索
          <Icon type="arrow-down-b"></Icon>
        </a>
        <DropdownMenu slot="list">
          <DropdownItem name="pastonehour">过去1h</DropdownItem>
          <DropdownItem name="pastfourhour">过去4h</DropdownItem>
          <DropdownItem name="pastoneday">过去1d</DropdownItem>
          <DropdownItem name="pasttoday">今天</DropdownItem>
          <DropdownItem name="pastthreeday">过去3d</DropdownItem>
          <DropdownItem name="pastweek">本周</DropdownItem>
          <DropdownItem name="lastweek">上周</DropdownItem>
          <DropdownItem name="pastmonth">本月</DropdownItem>
          <DropdownItem name="lastmonth">上月</DropdownItem>
          <DropdownItem name="presentyear">本年</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  </div>
</template>
<script>
import bus from '../../libs/bus';
// import util from '../libs/util';

export default {
  data() {
    return {
      // 保存date格式时间
      timeSets: {
        startTimePick: '',
        endTimePick: '',
      },
      startTime: '',
      endTime: '',
      selectDate: [],
    };
  },
  computed: {
    dateOptionEnd() {
      const self = this;
      const obj = {
        disabledDate(date) {
          if (self.timeSets.startTimePick) {
            const end = new Date(self.timeSets.startTimePick);
            // 设置前一天,可以选择开始日期的同一天
            end.setDate(end.getDate() - 1);
            return date && date.valueOf() < end.getTime();
          }
          return false;
        },
      };
      return obj;
    },
    dateOptionStart() {
      const self = this;
      const obj = {
        disabledDate(date) {
          if (self.timeSets.endTimePick) {
            return date && date.valueOf() > new Date(self.timeSets.endTimePick).getTime();
          }
          return false;
        },
      };
      return obj;
    },
  },
  methods: {
    // 对外接口,设置默认时间
    initTime(obj) {
      if (obj) {
        // 设置开始时间
        const dateStart = obj.start.slice(0, 10);
        const timeStart = obj.start.slice(11);
        const arrStart = timeStart.split(':');
        const hourStart = parseInt(arrStart[0], 10);
        const minuteStart = parseInt(arrStart[1], 10);
        const start = new Date(dateStart);
        start.setHours(hourStart);
        start.setMinutes(minuteStart);
        // 设置结束时间
        const dateEnd = obj.end.slice(0, 10);
        const timeEnd = obj.end.slice(11);
        const arrEnd = timeEnd.split(':');
        const hourEnd = parseInt(arrEnd[0], 10);
        const minuteEnd = parseInt(arrEnd[1], 10);
        const end = new Date(dateEnd);
        end.setHours(hourEnd);
        end.setMinutes(minuteEnd);
        // 赋值给组件
        this.timeSets.startTimePick = start;
        this.timeSets.endTimePick = end;
        this.startTime = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm');
        this.endTime = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm');
      } else {
        const end = new Date();
        const start = new Date();
        // start.setHours(start.getHours() - 1);
        start.setHours(0);
        start.setMinutes(0);
        end.setHours(23);
        end.setMinutes(59);
        this.timeSets.startTimePick = start;
        this.timeSets.endTimePick = end;
        this.startTime = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm');
        this.endTime = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm');
      }
    },
    getStartTime(time) {
      const oldDate = this.startTime.slice(0, 10);
      const oldTime = this.startTime.slice(11);
      const arr = oldTime.split(':');
      const hour = parseInt(arr[0], 10);
      const minute = parseInt(arr[1], 10);
      if (time) {
        this.startTime = time;
        this.selectDate = [this.startTime, this.endTime];
      }
      if (time) {
        const newDate = time.slice(0, 10);
        // const newTime = time.slice(11);
        // 日期相等,说明修改的是时间,也可能点击了同一天,点击同一天目前无法判断
        if (newDate === oldDate) {
          this.startTime = time;
        } else {
          this.startTime = `${newDate}-${oldTime}`;
          const start = new Date(newDate);
          start.setHours(hour);
          start.setMinutes(minute);
          this.timeSets.startTimePick = start;
        }
        this.selectDate = [this.startTime, this.endTime];
      } else {
        // 清空时恢复到startTime初始化状态
        const start = new Date(oldDate);
        start.setHours(hour);
        start.setMinutes(minute);
        this.timeSets.startTimePick = start;
      }
    },
    // 获取结束时间
    getEndTime(time) {
      const oldDate = this.endTime.slice(0, 10);
      const oldTime = this.endTime.slice(11);
      const arr = oldTime.split(':');
      const hour = parseInt(arr[0], 10);
      const minute = parseInt(arr[1], 10);
      if (time) {
        const newDate = time.slice(0, 10);
        // const newTime = time.slice(11);
        // 日期相等,说明修改的是时间,也可能点击了同一天,点击同一天目前无法判断
        if (newDate === oldDate) {
          this.endTime = time;
        } else {
          this.endTime = `${newDate}-${oldTime}`;
          const end = new Date(newDate);
          end.setHours(hour);
          end.setMinutes(minute);
          this.timeSets.endTimePick = end;
        }
        this.selectDate = [this.startTime, this.endTime];
      } else {
        // 清空时恢复到endtime初始化状态
        const end = new Date(oldDate);
        end.setHours(hour);
        end.setMinutes(minute);
        this.timeSets.endTimePick = end;
      }
    },
    // 快速查询
    quickSearch(name) {
      if (name === 'search') {
        this.selectDate = [this.startTime, this.endTime];
        // bus.$emit('on-date-change', this.selectDate);
        this.$emit('on-date-change', this.selectDate);
      } else {
        let end = new Date();
        let start = new Date();
        const weekth = end.getDay() ? end.getDay() : 7;
        const dayth = start.getDate();
        const yearth = start.getFullYear();
        if (name === 'pastonehour') {
          start.setHours(start.getHours() - 1);
        } else if (name === 'pastfourhour') {
          start.setHours(start.getHours() - 4);
        } else if (name === 'pastoneday') {
          start.setDate(start.getDate() - 1);
        } else if (name === 'pasttoday') {
          start.setHours(0);
          start.setMinutes(0);
        } else if (name === 'pastthreeday') {
          start.setDate(start.getDate() - 3);
        } else if (name === 'pastweek') {
          start.setDate(start.getDate() - (weekth - 1));
          start.setHours(0);
          start.setMinutes(0);
          // end.setDate(end.getDate() + (7 - weekth));
        } else if (name === 'lastweek') {
          start.setDate(dayth - (weekth + 6));
          end.setDate(dayth - weekth);
        } else if (name === 'pastmonth') {
          // 本月1号
          start.setDate(start.getDate() - (dayth - 1));
          start.setHours(0);
          start.setMinutes(0);
          // end.setDate(end.getDate() - (dayth - 1));
          // // 次月1号
          // end.setMonth(end.getMonth() + 1);
          // end.setDate(end.getDate() - 1);
        } else if (name === 'lastmonth') {
          // 本月1号
          start.setDate(dayth - (dayth - 1));
          end.setDate(end.getDate() - (dayth - 1));
          // 上月1号
          start.setMonth(start.getMonth() - 1);
          end.setDate(end.getDate() - 1);
        } else if (name === 'presentyear') {
          start = new Date(`${yearth}/1/1`);
          end = new Date(`${yearth}/12/31`);
        }
        if (name.indexOf('past') === -1) {
          start.setHours(0);
          start.setMinutes(0);
          end.setHours(23);
          end.setMinutes(59);
        }
        this.timeSets.startTimePick = start;
        this.timeSets.endTimePick = end;
        this.startTime = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm');
        this.endTime = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm');
        this.selectDate = [this.startTime, this.endTime];
        // bus.$emit('on-date-change', this.selectDate);
        this.$emit('on-date-change', this.selectDate);
      }
    },
  },
  watch: {
  },
  mounted() {
    this.initTime();
  },
  beforeDestroy() {
  },
};
</script>
