<style lang="scss">
  @import './chart-tag.scss';
</style>
<template>
  <Form class="chart-tag" :model="elementInfo" ref="elementInfo">
    <Row>
      <Col span="12">
      <FormItem :label-width="80" label="metric" prop="metric" :rules="{ required: true, type: 'string', message: '请输入metric名称', trigger: 'change' }">
        <Select ref="metricSelect" v-model="elementInfo.metric" filterable transfer @on-change="selectMetric">
          <Option v-for="(item, index) in metricShowList.arr" :key="item + index"
          :value="item">{{item}}</Option>
        </Select>
        <span v-if="metricShowList.text" class="error-info-text">{{metricShowList.text}}</span>
      </FormItem>
      </Col>
      <Col span="12">
        <Button class="ml-10" v-if="countTotal > 1" icon="trash-a" @click="deleteTarget">删除指标</Button>
      </Col>
    </Row>
    <Row v-if="elementInfo.tagList.length > 0">
      <FormItem v-for="(item, index) in elementInfo.tagList" :key="index" :label="item.name" :class="[item.name === 'host' ? 'host-form-item' : '']" :label-width="100" :ref="'tagItem' + index" :prop="'tagList.' + index + '.value'" :rules="{ required: true, type: 'array', min: 1, message: '请选择tag值'}">
        <multiple-select ref="hostSelect" v-if="item.name === 'host'" @on-change="selectHost($event, index)" :selectId="'host_select_' + pointer + '_' + index" v-model="item.value" :dataList="tagShowList[index].list" :disabled="false" :transfer="true" placeholder="请选择主机"></multiple-select>
        <Select v-else v-model="item.value" ref="tagSelect" @on-change="selectTag(index)"
        placeholder="请选择tag值"
        multiple 
        filterable 
        transfer
        not-found-text="">
          <Option v-for="(op, j) in tagShowList[index].list" :key="op + j" :disabled="op !== '*' && item.value.toString() === '*'" :value="op">{{op}}</Option>
        </Select>
        <p v-if="tagShowList[index].text" class="error-text">{{tagShowList[index].text}}</p>
      </FormItem>
    </Row>
  </Form>
</template>
<script>
// import _ from 'lodash';
import bus from '../../libs/bus';
import { getSuggestTags } from '../../models/service';
import multipleSelect from '../common/multiple-select/multiple-select';

export default {
  name: 'chartTag',
  props: {
    // 产品id
    productId: {
      type: Number,
      default: 0,
    },
    // 序号
    pointer: {
      type: Number,
      default: 0,
    },
    // metric列表
    metricList: {
      type: Array,
      default: () => [],
    },
    countTotal: {
      type: Number,
      default: 1,
    },
  },
  components: { multipleSelect },
  data() {
    return {
      // 指标信息
      elementInfo: {
        metric: '',
        // name: '',
        tagList: [], // 标签列表
      },
      metricLoading: false,
      keydataList: [], // tag标签键列表
      target: null, // 获取到的数据
      tagSet: null, // 根据你metric获取的tags信息
      setDataFlag: false, // true时为获取数据,编辑状态
    };
  },
  watch: {},
  beforeDestroy() {},
  methods: {
    // 选择metric
    selectMetric() {
      if (this.elementInfo.metric) {
        const params = {
          product_id: this.productId,
          metric: this.elementInfo.metric,
        };
        this.getSuggestTags(params);
      } else {
        this.elementInfo.tagList = [];
      }
    },
    // 选择主机
    selectHost(arr, index) {
      this.elementInfo.tagList[index].value = arr;
      if (this.$refs.elementInfo && this.$refs[`tagItem${index}`]) {
        this.$refs.elementInfo.validateField(`tagList.${index}.value`);
      }
    },
    selectTag(index) {
      const arr = this.elementInfo.tagList[index].value;
      if (arr.length > 0 && arr.indexOf('*') > -1) {
        this.elementInfo.tagList[index].value = ['*'];
      }
    },
    // 获取tags列表
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.tagSet = res.data.tag_set;
          this.elementInfo.tagList = [];
          if (res.data.code === 200) {
            const keyList = Object.keys(res.data.tag_set);
            keyList.forEach((item) => {
              if (item !== 'uuid') { // 滤除uuid
                // 除host外，增加all选项*
                const valueList = item === 'host' ? this.tagSet[item] : ['*', ...this.tagSet[item]];
                const tagObj = {
                  name: item,
                  list: valueList,
                  value: [],
                };
                this.elementInfo.tagList.push(tagObj);
              }
            });
            // 初始化编辑时将tags赋值给表单
            if (this.setDataFlag) {
              this.proTags(this.target.tags);
              this.setDataFlag = false; // 再次修改时，不需要此步骤
            }
          }
        } else {
          this.elementInfo.tagList = [];
        }
      });
    },
    getStyles(width) {
      return `width: ${width}px;`;
    },
    filterMethod(value, option) {
      return option.toUpperCase().indexOf(value.toUpperCase()) !== -1;
    },
    // 删除该选项,第一步,传递要删除的参数
    deleteTarget() {
      this.$emit('on-delete-target', this.pointer);
    },
    // 第二步,on-delete-target回调，保存数据
    subSave() {
      bus.chartAddInfo.metricTarget[this.pointer] = this.elementInfo;
      this.$emit('sub-save-ok');
    },
    // 第三步,将数据重新赋值,sub-save-ok回调
    setSubdata(index) {
      if (index === this.pointer) {
        this.elementInfo.metric = bus.chartAddInfo.metricTarget[this.pointer].metric;
        // 当该项metric为空时，重置一下
        if (!this.elementInfo.metric && this.$refs.metricSelect) {
          this.$refs.metricSelect.reset();
        }
        this.elementInfo.tagList = bus.chartAddInfo.metricTarget[this.pointer].tagList;
      }
    },
    // 保存, chartdata点击确认后保存本身数据并返回给chartdata
    saveTarget(pointer) {
      if (this.pointer === pointer) {
        this.$refs.elementInfo.validate((valid) => {
          if (valid) {
            this.$emit('on-add-target-success', this.elementInfo, pointer);
          }
        });
      }
    },
    // 编辑已有图表状态时，先填充数据
    setMdata(data) {
      this.setDataFlag = true;
      this.target = Object.assign({}, data);
      this.elementInfo.metric = data.metric;
      this.selectMetric(); // 获取tag
      // this.proTags(data.tags);
    },
    clearHistory() {
      this.elementInfo.metric = '';
      this.setDataFlag = false;
      if (this.$refs.elementInfo) {
        this.$refs.elementInfo.resetFields();
      }
      if (this.$refs.metricSelect) {
        this.$refs.metricSelect.reset();
      }
      this.elementInfo.tagList = [];
    },
    // 获取文本宽度
    getWidth(str) {
      const sensor = document.createElement('pre');
      sensor.innerHTML = str;
      sensor.style.display = 'inline-block';
      sensor.style.width = 'auto';
      sensor.style.visibility = 'hidden';
      sensor.style.height = 0;
      sensor.style.position = 'relative';
      sensor.style['z-index'] = -10;
      document.body.appendChild(sensor);
      const width = sensor.offsetWidth;
      document.body.removeChild(sensor);
      const widthL = width > 180 ? width : 180;
      return widthL;
    },
    // 将tag添加到相应框内
    proTags(data) {
      const dou = data.indexOf(',');
      // 只有一组tag
      if (dou === -1) {
        const set = data.split('=');
        const tagValueArr = set[1].indexOf('|') > -1 ? set[1].split('|') : [set[1]];
        const tagIndex = this.elementInfo.tagList.findIndex(t => t.name === set[0]);
        if (tagIndex > -1) {
          this.elementInfo.tagList[tagIndex].value = tagValueArr;
        }
      } else { // 多组tag
        const mid = data.split(','); // ['key=v1','key=v2|v3',....]
        mid.forEach((item) => {
          const setInner = item.split('=');
          const innerValueArr = setInner[1].indexOf('|') > -1 ?
          setInner[1].split('|') : [setInner[1]];
          const tagIndex = this.elementInfo.tagList.findIndex(t => t.name === setInner[0]);
          if (tagIndex > -1) {
            this.elementInfo.tagList[tagIndex].value = innerValueArr;
          }
        });
      }
    },
  },
  computed: {
    // 将不在该产品线下的metric插入
    metricShowList() {
      const obj = {
        arr: [...this.metricList],
        text: '',
      };
      if (this.elementInfo.metric && this.metricList.indexOf(this.elementInfo.metric) === -1) {
        obj.arr.unshift(this.elementInfo.metric);
        obj.text = `metric：${this.elementInfo.metric}，不在当前产品线下`;
      }
      return obj;
    },
    // 展示tag,将不在的tag插入
    tagShowList() {
      const arr = [];
      if (this.elementInfo.tagList.length) {
        this.elementInfo.tagList.forEach((item) => {
          const obj = {
            list: [...item.list],
            text: '',
          };
          const unExist = []; // 不存在的tag值
          if (item.value.length > 0) {
            item.value.forEach((tagV) => {
              if (item.list.indexOf(tagV) === -1) {
                unExist.push(tagV);
                obj.list.unshift(tagV);
              }
            });
          }
          if (unExist.length > 0) {
            obj.text = `标签：${unExist.toString('，')}，不在当前metric和产品线下`;
          }
          arr.push(obj);
        });
      }
      return arr;
    },
  },
  mounted() {
    bus.$on('clear_history', () => {
      this.clearHistory();
    });
  },
};

</script>
