import Vue from 'vue';
import Cookies from 'js-cookie';
import md5 from 'md5';
// import cookie from 'js-cookie';
// eslint-disable-next-line
Date.prototype.setStart = function() {
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
};
// eslint-disable-next-line
Date.prototype.setEnd = function() {
  this.setHours(23);
  this.setMinutes(59);
  this.setSeconds(59);
};

export default new Vue({
  data() {
    return {
      selectDate: [], // 选中的时间段
      emailReg: /^[a-zA-Z0-9]{1,10}@[a-zA-Z0-9]{1,5}\.[a-zA-Z0-9]{1,5}$/,
      // 创建策略信息
      buildRuleInfo: {
        triggers: [],
        actions: [],
      },
      backtoRulelist: '', // 返回策略列表页信息
      role: md5(1),
    };
  },
  methods: {
    // 获取初始化时间，默认最近一周
    getDefaultDate() {
      let start = this.getDays(-7);
      let end = this.getDays(0);
      start.setStart();
      end.setEnd();
      // let start = this.getHoursTime(-1);
      // let end = this.getHoursTime(0);
      start = this.timeFormate(start, 'yyyy-MM-dd hh:mm:ss');
      end = this.timeFormate(end, 'yyyy-MM-dd hh:mm:ss');
      this.selectDate = [start, end];
    },
    getHoursTime(hours) {
      const today = new Date().getTime();
      const date = new Date(today + (hours * 60 * 60 * 1000));
      return date;
    },
    // 初始化日期
    getDays(days) {
      const today = new Date().getTime();
      const date = new Date(today + (days * 24 * 60 * 60 * 1000));
      return date;
    },
    formatDate(date, type) {
      const yy = date.getFullYear();
      const dateM = date.getMonth() + 1;
      const mm = dateM > 9 ? dateM : `0${dateM}`;
      const dateD = date.getDate();
      const dd = dateD > 9 ? dateD : `0${dateD}`;
      if (type) {
        return `${yy}${type}${mm}${type}${dd}`;
      }
      return `${yy}${mm}${dd}`;
    },
    timeFormate(date, fmt) {
      const time = new Date(date);
      let fm = fmt;
      // fmt 自定义格式,如：yy-MM-dd
      let week = '';
      switch (time.getDay()) {
        case 0:
          week = '周日';
          break;
        case 1:
          week = '周一';
          break;
        case 2:
          week = '周二';
          break;
        case 3:
          week = '周三';
          break;
        case 4:
          week = '周四';
          break;
        case 5:
          week = '周五';
          break;
        case 6:
          week = '周六';
          break;
        default:
          week = '';
          break;
      }
      const o = {
        'M+': time.getMonth() + 1, // 月份
        'd+': time.getDate(), // 日
        'h+': time.getHours(), // 小时
        'm+': time.getMinutes(), // 分
        's+': time.getSeconds(), // 秒
        'q+': Math.floor((time.getMonth() + 3) / 3), // 季度
        S: time.getMilliseconds(), // 毫秒
        w: week,
      };
      if (/(y+)/.test(fm)) {
        fm = fm.replace(RegExp.$1, (time.getFullYear().toString()).substr(4 - RegExp.$1.length));
      }
      Object.keys(o).forEach((k) => {
        if (new RegExp(`(${k})`).test(fm)) {
          fm = fm.replace(RegExp.$1, (RegExp.$1.length === 1) ?
            (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
        }
      });
      return fm;
    },
    isEmptyObject(obj) {
      if (obj) {
        let name = '';
        // eslint-disable-next-line
        for (name in obj) { return false; }
        return true;
      }
      return true;
    },
    validateEmail(rule, value, callback) {
      if (value === '') {
        callback(new Error('请输入邮箱'));
      } else if (!this.emailReg.test(value)) {
        callback(new Error('邮箱格式不正确'));
      } else {
        callback();
      }
    },
    getNumStr(num) {
      if (num >= 1000) {
        const kbNum = num / 1000;
        if (kbNum >= 1000) {
          const mbNum = kbNum / 1000;
          if (mbNum > 1000) {
            const gbNum = mbNum / 1000;
            if (gbNum > 1000) {
              const tbNum = gbNum / 1000;
              if (tbNum > 1000) {
                const pbNum = tbNum / 1000;
                return `${pbNum.toFixed(2)}PB`;
              }
              return `${tbNum.toFixed(2)}TB`;
            }
            return `${gbNum.toFixed(2)}GB`;
          }
          return `${mbNum.toFixed(2)}MB`;
        }
        return `${kbNum.toFixed(2)}KB`;
      }
      return num.toFixed(2);
    },
  },
  created() {
    this.getDefaultDate();
  },
  computed: {
    isAdmin() {
      return this.role === Cookies.get('owl_role');
    },
  },
});
