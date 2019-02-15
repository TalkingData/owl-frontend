const portReg = /[\d]+[-]?[\d]*/;
const ipReg =
  /^((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))\/(([0-2]?\d)|(3[0-2]))$/;
const nameReg = /^[A-Za-z]+$/;

const ipaddress = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

const pathReg = /^(\.|(\.\.(\/\.\.)*))?(\/[\w-]+)*(\.\w+)+$/;
const phoneReg = /^1\d{10}$/;
// eslint-disable-next-line
const emailReg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
const wechatReg = /^[a-zA-Z0-9]{1}([-_a-zA-Z0-9]{5,19})+$/;
// 以字母开头，长度在6~31之间，只能包含字符、数字和下划线
// const pswReg = /^[a-zA-Z]\w{4,31}$/;
const pswReg = /[a-zA-Z0-9]{4,31}/;

const Util = {
  validatePort(rule, value, callback) {
    if (value === '') {
      callback(new Error('请输入端口号'));
    } else if (!portReg.test(value)) {
      callback(new Error('请输入正确格式端口号'));
    } else if (typeof value === 'string') {
      const str = value.trim();
      let arr = [];
      if (str) {
        if (str.lastIndexOf('-') === str.length - 1) {
          callback(new Error('请输入正确格式端口号'));
        } else {
          if (str.indexOf('-') > -1) {
            arr = str.split('-');
          } else {
            arr = [str, str];
          }
          let fromPort = parseInt(arr[0], 10);
          let toPort = parseInt(arr[1], 10);
          if (fromPort > toPort) {
            const temp = fromPort;
            fromPort = toPort;
            toPort = temp;
          }
          if (fromPort < 1 || fromPort > 65535 || toPort < 1 || toPort > 65535) {
            callback(new Error('端口号范围1-65535'));
          } else {
            callback();
          }
        }
      } else {
        callback(new Error('请输入正确格式端口号'));
      }
    } else {
      callback();
    }
  },
  validateIp(rule, value, callback) {
    if (value === '') {
      callback(new Error('请输入来源'));
    } else if (!ipReg.test(value)) {
      callback(new Error('请输入正确格式：xx.xx.xx.xx/xx'));
    } else {
      callback();
    }
  },
  validateName(rule, value, callback) {
    if (!value) {
      callback(new Error('请输入用户名'));
    } else if (!wechatReg.test(value)) {
      callback(new Error('用户名格式不正确'));
    } else {
      callback();
    }
  },
  validateIpAddress(rule, value, callback) {
    if (value === '') {
      callback(new Error('请输入ip'));
    } else if (!ipaddress.test(value)) {
      callback(new Error('请输入正确格式：xx.xx.xx.xx'));
    } else {
      callback();
    }
  },
  validateDns(rule, value, callback) {
    if (value === '') {
      callback(new Error('请输入dns'));
    } else if (!ipaddress.test(value)) {
      callback(new Error('请输入正确格式：xx.xx.xx.xx'));
    } else {
      callback();
    }
  },
  validatePath(rule, value, callback) {
    if (value === '') {
      callback(new Error('请输入文件路径'));
    } else if (!pathReg.test(value)) {
      callback(new Error('文件路径格式错误'));
    } else {
      callback();
    }
  },
  validatePhone(rule, value, callback) {
    if (!value) {
      // callback(new Error('请输入手机号'));
      callback();
    } else if (!phoneReg.test(value)) {
      callback(new Error('手机号格式不正确'));
    } else {
      callback();
    }
  },
  validateMail(rule, value, callback) {
    if (!value) {
      callback(new Error('请输入邮箱'));
    } else if (!emailReg.test(value)) {
      callback(new Error('邮箱格式不正确'));
    } else {
      callback();
    }
  },
  validateWechat(rule, value, callback) {
    if (!value) {
      // callback(new Error('请输微信号'));
      callback();
    } else if (!wechatReg.test(value)) {
      callback(new Error('微信号格式不正确'));
    } else {
      callback();
    }
  },
  validateOldPsd(rule, value, callback) {
    if (!value) {
      callback(new Error('原始密码不能为空'));
    } else if (!pswReg.test(value)) {
      callback(new Error('密码格式不正确,以字母开头，长度在6~31之间，只能包含字符、数字和下划线'));
    } else {
      callback();
    }
  },
  validateNewPsd(rule, value, callback) {
    if (!value) {
      callback(new Error('新密码不能为空'));
    } else if (!pswReg.test(value)) {
      callback(new Error('密码格式不正确,以字母开头，长度在6~31之间，只能包含字符、数字和下划线'));
    } else {
      callback();
    }
  },
  /* 两个IP地址做 与 操作 返回结果 */
  /* 该功能主要用来实现 IP地址和子网掩码 相与，获取当前IP地址的IP地址段 */
  /* 以此来验证输入的网关地址是否合法 */
  getIPsAndResult(ipAddr1, ipAddr2) {
    const ipArray1 = ipAddr1.split('.');
    const ipArray2 = ipAddr2.split('.');
    let returnResult = '';
    if (ipArray1.length !== 4 || ipArray2.length !== 4) {
      return '';
    }
    for (let i = 0; i < 4; i += 1) {
      const number1 = parseInt(ipArray1[i], 10);
      const number2 = parseInt(ipArray2[i], 10);
      // eslint-disable-next-line
      returnResult += (number1 & number2);
      if (i < 3) {
        returnResult += '.';
      }
    }
    return returnResult;
  },
  getMask(num) {
    if (num > 0 && num <= 32) {
      const currNum = parseInt(num, 10);
      const iCount = 32 - currNum;
      const number1 = new Array(currNum).fill(1).join('');
      const number0 = new Array(iCount).fill(0).join('');
      const number = `${number1}${number0}`;
      const str1 = parseInt(number.slice(0, 8), 2);
      const str2 = parseInt(number.slice(8, 16), 2);
      const str3 = parseInt(number.slice(16, 24), 2);
      const str4 = parseInt(number.slice(24, 32), 2);
      const mask = `${str1}.${str2}.${str3}.${str4}`;
      return mask;
    }
    return '';
  },
  // ip地址是否合法
  judgeIpIsLegal(ipAddr) {
    const regIps = /^(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|[0-9])\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|[0-9]))$/;
    return regIps.test(ipAddr);
  },
  /* IP地址转换为二进制字符串 */
  /* 例如：172.16.4.235 --> 10101100000100000000010011101011 */
  praseIpToBinary(ipAddress) {
    const numArray = ipAddress.split('.');
    if (numArray.length !== 4) {
      return '';
    }
    let returnIpStr = '';
    for (let i = 0; i < 4; i += 1) {
      const currNum = numArray[i];
      let numberBin = parseInt(currNum, 10);
      numberBin = numberBin.toString(2);
      const iCount = 8 - numberBin.length;
      for (let j = 0; j < iCount; j += 1) {
        numberBin = `0${numberBin}`;
      }
      returnIpStr += numberBin;
    }
    return returnIpStr;
  },
  startTimePick(rule, value, callback) {
    if (value === '' || value === 0) {
      callback(new Error('请选择起始时间'));
    } else {
      callback();
    }
  },
  endTimePick(rule, value, callback) {
    if (value === '' || value === 0) {
      callback(new Error('请选择结束时间'));
    } else {
      callback();
    }
  },
  bySort(name) {
    // eslint-disable-next-line
    return function(o, p) {
      let a;
      let b;
      if (typeof o === 'object' && typeof p === 'object' && o && p) {
        a = o[name];
        b = p[name];
        if (a === b) {
          return 0;
        }
        if (typeof a === typeof b) {
          return a < b ? -1 : 1;
        }
        return typeof a < typeof b ? -1 : 1;
      }
    };
  },
  bySortDeep(...keys) {
    const self = this;
    // eslint-disable-next-line
    return function(o, p) {
      let a;
      let b;
      if (typeof o === 'object' && typeof p === 'object' && o && p) {
        if (keys.length > 1) {
          a = self.getSortByKey(o, ...keys);
          b = self.getSortByKey(p, ...keys);
        } else if (keys.length === 1) {
          a = o[keys[0]];
          b = p[keys[0]];
        } else {
          a = o;
          b = p;
        }
        if (a === b) {
          return 0;
        }
        if (typeof a === typeof b) {
          return a < b ? -1 : 1;
        }
        return typeof a < typeof b ? -1 : 1;
      }
    };
  },
  getSortByKey(obj, ...keys) {
    // eslint-disable-next-line
    const str = keys.reduce(function(x, y) {
      if (typeof x === 'object') {
        return x[y];
      }
      if (y) {
        return obj[x][y];
      }
      return obj[x];
    });
    return str;
  },
  byRev(name) {
    // eslint-disable-next-line
    return function(o, p) {
      let a;
      let b;
      if (typeof o === 'object' && typeof p === 'object' && o && p) {
        a = o[name];
        b = p[name];
        if (a === b) {
          return 0;
        }
        if (typeof a === typeof b) {
          return a < b ? 1 : -1;
        }
        return typeof a < typeof b ? 1 : -1;
      }
    };
  },
  byRevDeep(...keys) {
    const self = this;
    // eslint-disable-next-line
    return function(o, p) {
      let a;
      let b;
      if (typeof o === 'object' && typeof p === 'object' && o && p) {
        if (keys.length > 1) {
          a = self.getSortByKey(o, ...keys);
          b = self.getSortByKey(p, ...keys);
        } else if (keys.length === 1) {
          a = o[keys[0]];
          b = p[keys[0]];
        } else {
          a = o;
          b = p;
        }
        if (a === b) {
          return 0;
        }
        if (typeof a === typeof b) {
          return a < b ? 1 : -1;
        }
        return typeof a < typeof b ? 1 : -1;
      }
    };
  },
  csvToJson(csv) {
    const lines = csv.split('\n');
    const result = [];
    const headers = lines[0].split(',');
    for (let i = 1; i < lines.length; i += 1) {
      const obj = {};
      const currentline = lines[i].split(',');
      if (currentline.length === headers.length) {
        for (let j = 0; j < headers.length; j += 1) {
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
    }
    // return JSON.stringify(result); // JSON
    return { headers, result }; // JSON
  },
};
export default Util;
