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
              <Form-item prop="metric" :rules="{required: true, type: 'string', trigger: 'change', message: '请添加metric'}">
                <AutoComplete
                  v-model="data.metric"
                  :data="metricList"
                  :filter-method="metricSearch"
                  placeholder="metric必填"
                  :disabled="viewDisable"
                  @on-search="selectMetric"
                  @on-select="selectMetric"
                  ></AutoComplete>
                </Form-item>
            </div>
            <div class="float-left ml-10">
              <Form-item label="计算规则" :label-width="80">
                <div class="float-left">
                  <Select style="width:100px;" v-model="data.method" :disabled="viewDisable">
                    <Option v-for="item in methodArr" :key="item.value" :value="item.value" :label="item.label">{{item.label}}</Option>
                  </Select>
                  <InputNumber 
                  v-if="data.method=='top'||data.method=='bottom'||data.method=='last'||data.method=='ratio'" 
                  :min="0" 
                  v-model="data.number"
                  :disabled="viewDisable"></InputNumber>
                  <span class="character">—</span>
                  <Select style="width:80px;" v-model="data.symbol" :disabled="viewDisable">
                    <Option v-for="item in symbolArr" :key="item" :value="item" :label="item">{{item}}</Option>
                  </Select>
                  <span class="character">—</span>
                  <InputNumber v-model="data.threshold" placeholder="threshold" :disabled="viewDisable"></InputNumber>
                  <!-- <span>{{data.threshold}}</span> -->
                </div>
                <!-- <div class="float-left ml-10">
                  <Input v-model="data.description" style="width:100px" placeholder="备注"></Input>
                </div> -->
              </Form-item>
            </div>
            <div class="float-left metric-block ml-10 mr-10">
              tags:
            </div>
            <div class="float-left metric-block mr-10" v-for="(tag, index) in data.tags" :key="index">
              <div class="tag-block">
                <span>{{tag.key}}</span>:
                <span>{{tag.value}}</span>
                <Icon type="ios-close-empty" size="14" @click.native.stop="removetag(index)" :disabled="viewDisable"></Icon>
                <!-- <i class="ivu-icon ivu-icon-ios-close-empty"></i> -->
              </div>
            </div>
            <div class="float-left metric-block mr-10" v-if="data.tags.length === 0">暂无</div>
            <div class="float-left pt-2" v-if="!addTagFlag">
              <Button icon="plus" @click="showAddtag" :disabled="viewDisable"></Button>
            </div>
          </Col>
          <Col span="2">
            <div class="float-right">
              <Button icon="ios-trash" v-show="num > 0" @click="deleteBlock" :disabled="viewDisable"></Button>
            </div>
          </Col>
        </Row>
      </Form>
      <Form :model="tagAddInfo" ref="tagAddInfo" v-if="addTagFlag">
        <Row class="view-tag-item">
          <div class="float-left float-item mr-10">
            tag
          </div>
          <div class="float-left">
            <Form-item prop="key" :rules="{required: true, type: 'string', trigger: 'change', message: 'key不能为空'}">
              <AutoComplete v-model="tagAddInfo.key"
                :data="tagKeyList"
                :filter-method="metricSearch"
                placeholder="key"
                @on-search="selectKey"
                @on-select="selectKey"
                style="width: 200px;"
                ></AutoComplete>
            </Form-item>
          </div>
          <div class="float-left float-item pl-10 pr-10">
            =
          </div>
          <div class="float-left">
            <Form-item prop="value" :rules="{required: true, type: 'string', trigger: 'change', message: 'value不能为空'}">
              <AutoComplete
                v-model="tagAddInfo.value"
                :style="inputStyle"
                placeholder="value"
                @on-search="selectValue"
                @on-select="selectValue">
                <Option v-for="(item, index) in tagValueList" :value="item" :key="index">{{ item }}</Option>
              </AutoComplete>
            </Form-item>
          </div>
          <div class="float-left ml-10 pt-2">
            <Button type="primary" icon="plus" @click="addtag">保存</Button>
            <Button class="ml-10" @click="cancelAddTag">取消</Button>
          </div>
        </Row>
      </Form>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
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
  },
  data() {
    return {
      // block数据集合
      data: {
        productId: '',
        metric: '', // 名称
        tags: [],
        method: 'max',
        number: 0, // 数量
        symbol: '==',
        threshold: 0,
        description: '', // 备注
        index: '',
      },
      // 增加tag信息
      tagAddInfo: {
        key: '',
        value: '',
      },
      addTagFlag: false,
      tags: '', // 组装好的标签
      tagSet: null, // 保存获取的可选tag对象
      tagKeyList: [],
      tagValueList: [],
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
    // 搜索metric项
    metricSearch(value, option) {
      return option.toUpperCase().indexOf(value.toUpperCase()) !== -1;
    },
    // 搜索metric
    // eslint-disable-next-line
    selectMetric: _.debounce(function() {
      if (this.data.metric) {
        const params = {
          metric: this.data.metric,
        };
        if (this.productId) params.product_id = this.productId;
        this.getSuggestTags(params);
      } else {
        this.tagKeyList = [];
        this.tagValueList = [];
      }
    }, 300),
    // 搜索特定key下的value
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200) {
          this.tagSet = res.data.tag_set;
          if (res.data.code === 200) {
            const arr = Object.keys(res.data.tag_set);
            this.tagKeyList = arr.filter(t => t !== 'host');
          }
        } else {
          this.tagKeyList = [];
        }
      });
    },
    // 搜索tag中的key
    // eslint-disable-next-line
    selectKey: _.debounce(function() {
      if (this.tagAddInfo.key) {
        if (this.tagSet) {
          this.tagValueList = this.tagSet[this.tagAddInfo.key];
        } else {
          this.tagValueList = [];
        }
      } else {
        this.tagValueList = [];
      }
    }, 300),
    // eslint-disable-next-line
    selectValue: _.debounce(function() {
      if (this.tagAddInfo.value) {
        const width = this.getWidth(this.tagAddInfo.value);
        this.widthInput = width + 20;
      } else {
        this.widthInput = 200;
      }
    }, 300),
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
      return width;
    },
    // 删除block
    deleteBlock() {
      this.$emit('on-delete-block', this.num);
    },
    // on-delete-block回调，删除时保存所有规则块的数据
    sub_save() {
      this.linkStr();
      this.data.index = this.title;
      bus.buildRuleInfo.triggers[this.num] = this.data;
      this.$emit('sub-save-ok');
    },
    // 重新赋值,sub-save-ok回调
    set_sudata(index) {
      if (index === this.num) {
        this.data = bus.buildRuleInfo.triggers[this.num];
      }
    },
    // 添加tag
    addtag() {
      this.$refs.tagAddInfo.validate((valid) => {
        if (valid) {
          this.widthInput = 200;
          this.data.tags.push({
            key: this.tagAddInfo.key,
            value: this.tagAddInfo.value,
          });
          this.addTagFlag = false;
          this.tagValueList = [];
          this.tagAddInfo.key = '';
          this.tagAddInfo.value = '';
        }
      });
    },
    // 展开tag增加
    showAddtag() {
      this.widthInput = 200;
      this.tagValueList = [];
      this.addTagFlag = true;
      this.tagAddInfo.key = '';
      this.tagAddInfo.value = '';
      if (this.data.metric) {
        const params = {
          metric: this.data.metric,
        };
        if (this.productId) params.product_id = this.productId;
        this.getSuggestTags(params);
      }
    },
    cancelAddTag() {
      this.widthInput = 200;
      this.addTagFlag = false;
      this.tagValueList = [];
      this.tagAddInfo.key = '';
      this.tagAddInfo.value = '';
    },
    // 删除tag
    removetag(index) {
      if (!this.viewDisable) {
        this.data.tags.splice(index, 1);
      }
    },
    // tags字符串拼接
    linkStr() {
      let tagstr = '';
      const tagObj = {};
      this.data.tags.forEach((unit) => {
        if (!tagObj[unit.key]) {
          tagObj[unit.key] = [];
          tagObj[unit.key].push(unit.value);
        } else if (tagObj[unit.key].indexOf(unit.value) < 0) {
          tagObj[unit.key].push(unit.value);
        }
      });
      Object.keys(tagObj).forEach((item, index) => {
        if (index === 0) {
          tagstr += `${item}=${tagObj[item].join('|')}`;
        } else {
          tagstr += `,${item}=${tagObj[item].join('|')}`;
        }
      });
      this.tags = tagstr;
      return tagstr;
    },
    // 触发验证,验证填写内容
    vertifyRuleBlock(index) {
      if (this.num === index) {
        this.data.index = this.title;
        this.$refs.ruleItem.validate((valid) => {
          if (valid) {
            const tagStr = this.linkStr();
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
  },
  computed: {
    title() {
      return String.fromCharCode(this.num + 65);
    },
    inputStyle: {
      get() {
        return `width: ${this.widthInput}px;`;
      },
      set(newValue) {
        this.inputStyle = newValue;
      },
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
