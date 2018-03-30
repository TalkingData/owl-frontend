<style lang="scss">
@import './per-transfer.scss'

</style>
<template>
  <div class="per-transfer">
    <Row>
      <Col span="10" class="view-left">
      <div class="per-transfer-list" style="height: 300px;">
        <div class="ivu-transfer-list-header">
          <Checkbox v-model="srcAll" @on-change="checkAllSrc"></Checkbox>
          <span class="ml-4 mr-4
            ">{{titles[0]}}</span>
          <span class="pl-4 float-right">{{srcSelected.length}}/{{showSrcArr.length}}</span>
        </div>
        <div class="ivu-transfer-list-body ivu-transfer-list-body-with-search">
          <div class="ivu-transfer-list-body-search-wrapper">
            <div class="ivu-transfer-list-search">
              <Input icon="ios-search" size="small" type="text" v-model="searchNameSrc" @on-keyup="searchSrc"></Input>
            </div>
          </div>
          <ul class="ivu-transfer-list-content">
            <li class="ivu-transfer-list-content-item" v-for="(item, index) in showSrcArr" :key="index">
              <Checkbox v-model="item.check" @on-change="checkSrc(index, item)"></Checkbox>
              <span>{{item.label}}</span>
            </li>
          </ul>
        </div>
      </div>
      </Col>
      <Col span="4" class="view-mid" style="height: 300px;">
      <div class="view-mid-text">
        <div class="mb-10">
          <Button type="primary" size="small" @click="addData" :disabled="isadd">添加
            <Icon type="ios-arrow-right"></Icon>
          </Button>
        </div>
        <div>
          <Button type="primary" size="small" @click="removeData" :disabled="isremove">
            <Icon type="ios-arrow-left"></Icon> 取消</Button>
        </div>
      </div>
      </Col>
      <Col span="10">
      <div class="per-transfer-list" style="height: 300px;">
        <div class="ivu-transfer-list-header">
          <Checkbox v-model="desAll" @on-change="checkAllDes"></Checkbox>
          <span class="ml-4 mr-4
            ">{{titles[1]}}</span>
          <span class="pl-4 float-right">{{desSelected.length}}/{{showDesArr.length}}</span>
        </div>
        <div class="ivu-transfer-list-body ivu-transfer-list-body-with-search">
          <div class="ivu-transfer-list-body-search-wrapper">
            <div class="ivu-transfer-list-search">
              <Input icon="ios-search" size="small" type="text" v-model="searchNameDes" @on-keyup="searchDes"></Input>
            </div>
          </div>
          <ul class="ivu-transfer-list-content">
            <li class="ivu-transfer-list-content-item" v-for="(item, index) in showDesArr" :key="index">
              <Checkbox v-model="item.check" @on-change="checkDes(index, item)"></Checkbox>
              <span>{{item.label}}</span>
            </li>
          </ul>
        </div>
      </div>
      </Col>
    </Row>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../../libs/bus';
// import { getSuggestMetric } from '../../../models/service';

export default {
  name: 'perTransfer',
  components: {},
  props: {
    titles: {
      type: Array,
      default: () => ['可选主机组', '已选主机组'],
    },
    // 全部数据
    data: {
      type: Array,
      default: () => [],
    },
    // desStorage: {
    //   type: Array,
    //   default: () => [],
    // },
  },
  data() {
    return {
      searchNameSrc: '', // 源搜索
      searchNameDes: '',
      srcSelected: [], // 已选择源
      desSelected: [], // 已选择目标
      showSrcArr: [], // 展示源
      srcStorage: [], // 存储源
      showDesArr: [], // 展示目标
      desStorage: [], // 存储目标
      timeTest: null,
      srcAll: false, // 全选
      desAll: false,
    };
  },
  methods: {
    // 全选
    checkAllSrc() {
      // if (item.check) {
      //   this.srcSelected.push(item);
      // } else {
      //   for (let i = 0; i < this.srcSelected.length; i += 1) {
      //     if (this.srcSelected[i].id === item.id) {
      //       this.srcSelected.splice(i, 1);
      //       break;
      //     }
      //   }
      // }
    },
    checkAllDes() {},
    // eslint-disable-next-line
    searchSrc: _.debounce(function() {
      this.setSrcArr();
    }, 300),
    // 设置源数组显示
    setSrcArr() {
      if (this.searchNameSrc === '') {
        this.showSrcArr = this.data.filter((item) => {
          const obj = JSON.parse(JSON.stringify(item));
          // obj.check = false;
          return this.filterMethod(this.desStorage, obj);
        });
      } else {
        this.showSrcArr = this.data.filter((item) => {
          const obj = JSON.parse(JSON.stringify(item));
          // obj.check = false;
          return obj.label.indexOf(this.searchNameSrc) > -1 &&
            this.filterMethod(this.desStorage, obj);
        });
      }
    },
    // 匹配已选中数据,true代表未选中,显示再可选列表。false代表已选中,不显示可选列表
    filterMethod(arr, obj) {
      if (arr.length) {
        for (let i = 0; i < arr.length; i += 1) {
          if (arr[i].label === obj.label) {
            return false;
          }
        }
      }
      return true;
    },
    // eslint-disable-next-line
    searchDes: _.debounce(function() { // 搜索源
      this.setDesArr();
    }),
    // 设置目的展示数组
    setDesArr() {
      if (this.searchNameDes) {
        this.showDesArr = this.desStorage.filter((item) => {
          // const obj = JSON.parse(JSON.stringify(item));
          const obj = item;
          return obj.label.indexOf(this.searchNameDes) > -1;
        });
      } else {
        this.showDesArr = JSON.parse(JSON.stringify(this.desStorage));
      }
    },
    // 选择源
    checkSrc(index, item) {
      if (item.check) {
        this.srcSelected.push(item);
      } else {
        for (let i = 0; i < this.srcSelected.length; i += 1) {
          if (this.srcSelected[i].id === item.id) {
            this.srcSelected.splice(i, 1);
            break;
          }
        }
      }
    },
    // 选择目标
    checkDes(index, item) {
      if (item.check) {
        this.desSelected.push(item);
      } else {
        for (let i = 0; i < this.desSelected.length; i += 1) {
          if (this.desSelected[i].id === item.id) {
            this.desSelected.splice(i, 1);
            break;
          }
        }
      }
    },
    // 删除数组某项
    deleteMethodSrc(obj) {
      for (let i = 0; i < this.srcStorage.length; i += 1) {
        if (this.srcStorage[i].id === obj.id) {
          this.srcStorage.splice(i, 1);
          break;
        }
      }
    },
    // 删除数组某项
    deleteMethodDes(obj) {
      for (let i = 0; i < this.desStorage.length; i += 1) {
        if (this.desStorage[i].id === obj.id) {
          this.desStorage.splice(i, 1);
          break;
        }
      }
    },
    // 添加
    addData() {
      // this.srcStorage
      // this.srcSelected.
      // this.showSrcArr.forEach((item) => {
      //   if (item.check) {
      //     const obj = item;
      //     obj.check = false;
      //     this.desStorage.push(item);
      //   }
      // });
      let len = this.srcSelected.length;
      for (let i = 0; i < len; i += 1) {
        const ts = this.srcSelected[i];
        ts.check = false;
        // this.showDesArr.push(ts);
        this.desStorage.push(ts);
        this.deleteMethodSrc(ts);
        this.srcSelected.splice(i, 1);
        len -= 1;
        i -= 1;
      }
      this.checkAllSrc = false;
      this.showSrcArr = JSON.parse(JSON.stringify(this.srcStorage));
      this.showDesArr = JSON.parse(JSON.stringify(this.desStorage));
      this.searchNameSrc = ''; // 源搜索
      this.searchNameDes = '';
      this.$emit('on-get-target', this.desStorage);
    },
    // 移除
    removeData() {
      let len = this.desSelected.length;
      for (let i = 0; i < len; i += 1) {
        const ts = this.desSelected[i];
        ts.check = false;
        // this.showDesArr.push(ts);
        this.srcStorage.push(ts);
        this.deleteMethodDes(ts);
        this.desSelected.splice(i, 1);
        len -= 1;
        i -= 1;
      }
      this.checkAllDes = false;
      this.showSrcArr = JSON.parse(JSON.stringify(this.srcStorage));
      this.showDesArr = JSON.parse(JSON.stringify(this.desStorage));
      this.searchNameSrc = ''; // 源搜索
      this.searchNameDes = '';
      this.$emit('on-get-target', this.desStorage);
    },
  },
  computed: {
    // 保存源
    // srcStorage: {
    //   get() {
    //     return JSON.parse(JSON.stringify(this.data));
    //     // const Temp = this.data.filter((item) => {
    //     //   const obj = JSON.parse(JSON.stringify(item));
    //     //   return this.filterMethod(this.desStorage, obj);
    //     // });
    //     // return Temp;
    //   },
    //   set(newValue) {
    //     this.srcStorage = newValue;
    //   },
    // },
    isadd: {
      get() {
        return this.srcSelected.length === 0;
      },
      set(newValue) {
        this.isadd = newValue;
      },
    },
    isremove: {
      get() {
        return this.desSelected.length === 0;
      },
      set(newValue) {
        this.isadd = newValue;
      },
    },
  },
  watch: {
    data() {
      this.setSrcArr();
      this.srcStorage = JSON.parse(JSON.stringify(this.data));
      this.showSrcArr = JSON.parse(JSON.stringify(this.data));
    },
    // desStorage() {
    //   this.setSrcArr();
    //   this.setDesArr();
    //   // this.showSrcArr = this.data.filter((item) => {
    //   //   const obj = JSON.parse(JSON.stringify(item));
    //   //   obj.check = false;
    //   //   return this.filterMethod(this.desStorage, item);
    //   // });
    // },
  },
  mounted() {
    this.timeTest = new Date().getTime();
    // this.showDesArr = JSON.parse(JSON.stringify(this.desStorage));
    this.$nextTick(() => {
      const now = new Date().getTime();
    });
  },
  beforeDestroy() {},
};

</script>
