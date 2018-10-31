<style lang="scss">
@import './rule-item.scss'

</style>
<template>
  <div class="rule-item-view">
    <div class="view-mid">
      <Form :model="data" ref="ruleItem">
        <Row>
          <Col span="1">
            <div class="float-left rule-title">
              <div class="rule-title-label">
                {{title}}
              </div>
            </div>
          </Col>
          <Col span="21" class="metric-main">
            <div class="float-left">
              <FormItem prop="metric" :rules="{required: true, type: 'string', trigger: 'change', message: '请添加metric'}">
                <Select ref="metricSelect" v-model="data.metric" 
                style="width: 200px;"
                placeholder="metric必填"
                :disabled="viewDisable"
                filterable transfer 
                @on-change="selectMetric">
                  <Option v-for="(item, index) in metricShowList.arr" :key="item + index"
                  :value="item">{{item}}</Option>
                </Select>
                <span v-if="metricShowList.text" class="error-info-text">{{metricShowList.text}}</span>
              </FormItem>
            </div>
            <div class="float-left ml-10">
              <FormItem label="计算规则" :label-width="80">
                <div class="float-left">
                  <Select style="width:100px;" v-model="data.method" :disabled="viewDisable">
                    <Option v-for="item in methodArr" :key="item.value" :value="item.value" :label="item.label">{{item.label}}</Option>
                  </Select>
                  <InputNumber 
                  v-if="data.method=='top'||data.method=='bottom'||data.method=='last'||data.method=='ratio'" 
                  :min="0" 
                  v-model="data.number"
                  :readonly="viewDisable"></InputNumber>
                  <span class="character">—</span>
                  <Select style="width:80px;" v-model="data.symbol" :disabled="viewDisable">
                    <Option v-for="item in symbolArr" :key="item" :value="item" :label="item">{{item}}</Option>
                  </Select>
                  <span class="character">—</span>
                  <InputNumber v-model="data.threshold" placeholder="threshold" :readonly="viewDisable"></InputNumber>
                  <span class="info-word">{{bytesToSize(data.threshold)}}</span>
                </div>
                <!-- <div class="float-left ml-10">
                  <Input v-model="data.description" style="width:100px" placeholder="备注"></Input>
                </div> -->
              </FormItem>
            </div>
          </Col>
          <Col span="2">
            <div class="float-right">
              <Button icon="ios-trash" v-show="allNum > 1" @click="deleteBlock" :disabled="viewDisable"></Button>
            </div>
          </Col>
        </Row>
        <Row v-if="data.tagList.length > 0" v-for="(item, index) in data.tagList" :key="'ss' + index">
          <div class="float-left mr-10">
            <FormItem :key="index" :label="item.name" :label-width="80" :prop="'tagList.' + index + '.value'" :rules="{ required: true, type: 'array', min: 1, message: '请选择tag值'}">
              <Select v-model="item.value" ref="tagSelect"
              placeholder="请选择tag值"
              :disabled="viewDisable"
              multiple 
              filterable 
              transfer
              not-found-text="">
                <Option v-for="(op, j) in item.list" :key="op + j"
                :value="op">{{op}}</Option>
              </Select>
            </FormItem>
          </div>
        </Row>
      </Form>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../../libs/bus';
import { getSuggestTags } from '../../../models/service';

export default {
  name: 'ruleItem',
  components: {},
  props: {
    // 查看状态下,不能编辑
    viewDisable: {
      type: Boolean,
      default: false,
    },
    // 该模块顺序码
    num: {
      type: Number,
      default: -1,
    },
    metricList: {
      type: Array,
      default: () => [],
    },
    // 该模块总数
    allNum: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      // block数据集合
      data: {
        productId: '',
        metric: '', // 名称
        tags: '',
        tagList: [], // 用于动态选择tag
        method: 'max',
        number: 0, // 数量
        symbol: '==',
        threshold: 0,
        description: '', // 备注
        index: '',
      },
      setDataFlag: false, // 初始化编辑
      tagSet: null, // 保存获取的可选tag对象
      // 函数数组
      methodArr: [{
        value: 'max',
        label: '最大值',
      }, {
        value: 'min',
        label: '最小值',
      }, {
        value: 'ratio',
        label: '环比',
      }, {
        value: 'top',
        label: 'Top',
      }, {
        value: 'bottom',
        label: 'Bottom',
      }, {
        value: 'last',
        label: 'Last',
      }, {
        value: 'nodata',
        label: 'Nodata',
      }, {
        value: 'diff',
        label: 'Diff',
      }, {
        value: 'avg',
        label: '平均值',
      }],
      symbolArr: ['==', '>=', '>', '<=', '<', '!='],
      flag: 0, // 交换规则
      widthInput: 200,
    };
  },
  methods: {
    // 选择metric
    selectMetric() {
      if (this.data.metric) {
        const params = {
          metric: this.data.metric,
        };
        if (this.productId) params.product_id = this.productId;
        this.getSuggestTags(params);
      } else {
        this.data.tagList = [];
      }
    },
    // 搜索特定metric下的tag
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        this.data.tagList = [];
        if (res.status === 200 && res.data && res.data.code === 200) {
          this.tagSet = res.data.tag_set;
          const keyList = Object.keys(res.data.tag_set);
          keyList.forEach((item) => {
            if (item !== 'uuid' && item !== 'host') { // 滤除uuid
              const tagObj = {
                name: item,
                list: this.tagSet[item],
                value: [],
              };
              this.data.tagList.push(tagObj);
            }
          });
          // 初始化编辑时将tags赋值给表单
          if (this.setDataFlag) {
            this.proTags(this.data.tags);
            this.setDataFlag = false; // 再次修改时，不需要此步骤
          }
        } else {
          this.data.tagList = [];
        }
      });
    },
    // 删除block
    deleteBlock() {
      this.$emit('on-delete-block', this.num);
    },
    // on-delete-block回调，删除时保存所有规则块的数据
    subSave() {
      this.tagsToString();
      this.data.index = this.title;
      bus.buildRuleInfo.triggers[this.num] = Object.assign({}, this.data);
      this.$emit('sub-save-ok');
    },
    // 重新赋值,sub-save-ok回调
    setSudata(index) {
      if (index === this.num) {
        this.data = Object.assign({}, bus.buildRuleInfo.triggers[this.num]);
      }
    },
    // 编辑已有策略时，先填充数据
    setMdata(index) {
      this.setDataFlag = true;
      if (index === this.num) {
        this.data = Object.assign({}, bus.buildRuleInfo.triggers[this.num]);
      }
      this.selectMetric(); // 获取tag
    },
    // tags字符串拼接
    tagsToString() {
      let str = '';
      this.data.tagList.forEach((item, index) => {
        if (index === 0) {
          str += `${item.name}=${item.value.join('|')}`;
        } else {
          str += `,${item.name}=${item.value.join('|')}`;
        }
      });
      return str;
    },
    // 将tag添加到相应框内
    proTags(data) {
      if (data) {
        const dou = data.indexOf(',');
        // 只有一组tag
        if (dou === -1) {
          const set = data.split('=');
          const tagValueArr = set[1].indexOf('|') > -1 ? set[1].split('|') : [set[1]];
          const tagIndex = this.data.tagList.findIndex(t => t.name === set[0]);
          if (tagIndex > -1) {
            this.data.tagList[tagIndex].value = tagValueArr;
          }
        } else { // 多组tag
          const mid = data.split(','); // ['key=v1','key=v2|v3',....]
          mid.forEach((item) => {
            const setInner = item.split('=');
            const innerValueArr = setInner[1].indexOf('|') > -1 ?
            setInner[1].split('|') : [setInner[1]];
            const tagIndex = this.data.tagList.findIndex(t => t.name === setInner[0]);
            if (tagIndex > -1) {
              this.data.tagList[tagIndex].value = innerValueArr;
            }
          });
        }
      }
    },
    // 触发验证,验证填写内容
    vertifyRuleBlock(index) {
      if (this.num === index) {
        this.data.index = this.title;
        this.$refs.ruleItem.validate((valid) => {
          if (valid) {
            const tagStr = this.tagsToString();
            const params = JSON.parse(JSON.stringify(this.data));
            params.tags = tagStr;
            // 当在不使用产品线的情况下,删除产品线id
            if (params.productId === '') delete params.productId;
            // 验证成功以后,将结果返回父级统一处理
            this.$emit('on-vertify-success', params, this.num);
          }
        });
      }
    },
    bytesToSize(bytes) {
      if (!bytes) return '0';
      const k = 1000; // or 1024
      const sizes = ['', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
    },
  },
  computed: {
    title() {
      return String.fromCharCode(this.num + 65);
    },
    // 将不在该产品线下的metric插入
    metricShowList() {
      const obj = {
        arr: [...this.metricList],
        text: '',
      };
      if (this.data.metric && this.metricList.indexOf(this.data.metric) === -1) {
        obj.arr.unshift(this.data.metric);
        obj.text = `metric：${this.data.metric}，不可用`;
      }
      return obj;
    },
  },
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
    }
  },
  beforeDestroy() {},
};

</script>
