<style lang="scss">
@import './build-step1.scss';

</style>
<template>
  <div class="build-step build-step-one">
    <Form :model="strategyInfo" ref="strategyInfoTop">
      <Row class="subody-panel-filter" v-if="showDescription">
        <FormItem label="描述" :label-width="70" prop="description" :rules="{required: true, type: 'string', trigger: 'change', message: '请填写描述'}">
          <Input class="build-des" :title="strategyInfo.description" type="textarea" v-model="strategyInfo.description" :autosize="{minRows: 2}" :readonly="viewDisable"></Input>
        </FormItem>
      </Row>
      <Row class="subody-panel-filter">
        <div class="float-left">
          <FormItem :label="typeName + '名称'" :label-width="70" prop="name" :rules="{required: true, type: 'string', trigger: 'change', message: '请填写名称'}">
            <Input style="width:200px;" :title="strategyInfo.name" type="text" v-model="strategyInfo.name" :readonly="viewDisable"></Input>
          </FormItem>
        </div>
        <div class="float-left ml-20">
          <FormItem label="告警级别" :label-width="70">
            <Select style="width:100px;" v-model="strategyInfo.priority" :disabled="viewDisable">
              <Option v-for="item in levelList" :key="item.value" :value="item.value" :label="item.label">{{item.label}}</Option>
            </Select>
          </FormItem>
        </div>
        <div class="float-left ml-20">
          <FormItem label="告警次数" :label-width="70">
            <InputNumber :min="1" v-model="strategyInfo.alarm_count" :readonly="viewDisable"></InputNumber>
          </FormItem>
        </div>
        <div class="float-left ml-20">
          <FormItem label="追溯时间" :label-width="70" prop="cycle">
            <InputNumber :min="1" v-model="strategyInfo.cycle" :rules="{required: true, type: 'number', trigger: 'change', message: '请填写追溯时间'}" :readonly="viewDisable"></InputNumber><span>分钟</span>
          </FormItem>
        </div>
      </Row>
    </Form>
    <div v-for="(item, index) in blockNumList" class="brule-body-panel-rlueblock">
      <div class="rule-block">
        <rule-item  ref="ruleBlock" :num="index" :key="index" 
        :view-disable="viewDisable"
        :metric-list="metricList"
        :all-num="blockNumList.length"
        @on-delete-block="subblock" 
        @sub-save-ok="subOk"
        @on-vertify-success="getRuleBlockData"></rule-item>
      </div>
    </div>
    <Row>
      <span>逻辑公式</span>
      <Select v-model="strategyInfo.logic" @on-change="logicChange" style="width: 100px;" :disabled="viewDisable">
        <Option value="AND">AND</Option>
        <Option value="OR">OR</Option>
        <!-- <Option value="自定义">自定义</Option> -->
      </Select>
      <Input v-model="strategyInfo.expression" style="width: 240px;" :readonly="viewDisable"></Input>
      <span class="reminder-word ml-10">如需自定义，请输入正确格式。例:A&&(B||C)</span>
    </Row>
    <Row class="mt-10">
      <Button type="primary" icon="plus" @click="addblock" :disabled="viewDisable || blockNumList.length > 25">添加规则块</Button>
    </Row>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../../libs/bus';
import { getSuggestMetric } from '../../../models/service';
import ruleItem from './rule-item';

export default {
  name: 'buildStep1',
  components: {
    ruleItem,
  },
  props: {
    typeName: {
      type: String,
      default: '策略',
    },
    // 查看状态下,不能编辑
    viewDisable: {
      type: Boolean,
      default: false,
    },
    strategyInfo: {
      type: Object,
      default: {
        name: '',
        priority: 1, // 告警级别
        alarm_count: 5, // 告警次数
        cycle: 5, // 追溯时间
        logic: 'OR', // 逻辑关系
        expression: 'A', // 自定义
        triggers: [], // 对应模块ruleItem
      },
    },
  },
  data() {
    return {
      productId: '',
      // 告警级别列表
      levelList: [{
        label: '严重',
        value: 1,
      }, {
        label: '较严重',
        value: 2,
      }, {
        label: '注意',
        value: 3,
      }],
      blockNumList: [1], // 模块数量ruleblock
      blockNum: 1,
      stepFlag: false, // 步骤一验证
      time: 0, // 触发次数,当为2时，表示两个子选项均作出了响应
      data1: {}, // 存储上边数据
      rank1: 0,
      data2: {}, // 存储下边数据
      rank2: 0,
      index: -1, // 要删除的block, 标识想要删除的规则块
      sub: 0, // subSave保存data到bus计数器
      metricList: [],
    };
  },
  methods: {
    // 用于测试
    vertifyStep() {
      this.$refs.strategyInfoTop.validate((valid) => {
        if (valid) {
          // 验证之前,清空当前项
          this.strategyInfo.triggers = [];
          this.$refs.ruleBlock.forEach((item, index) => {
            item.vertifyRuleBlock(index);
          });
        }
      });
    },
    // 验证成功后,获取ruleblock数据
    getRuleBlockData(data) {
      this.strategyInfo.triggers.push(data);
      if (this.strategyInfo.triggers.length === this.blockNumList.length) {
        this.$emit('on-vertify-success', this.strategyInfo, 'step1');
        this.stepFlag = true;
      } else {
        this.stepFlag = false;
      }
    },
    // 增加
    addblock() {
      this.blockNum += 1;
      this.blockNumList.push(this.blockNum);
      this.setLogic();
    },
    // 设置逻辑关系
    setLogic() {
      const title = String.fromCharCode(this.blockNum + 64);
      let logic = '';
      if (this.strategyInfo.logic === 'AND') {
        logic = '&&';
      } else if (this.strategyInfo.logic === 'OR') {
        logic = '||';
      }
      if (this.blockNumList.length > 1) {
        this.strategyInfo.expression = '';
        this.blockNumList.forEach((item, index) => {
          if (index === 0) {
            this.strategyInfo.expression += String.fromCharCode(index + 65);
          } else {
            this.strategyInfo.expression += ` ${logic} ${String.fromCharCode(index + 65)}`;
          }
        });
      } else {
        this.strategyInfo.expression = title;
      }
    },
    logicChange(value) {
      if (value === 'AND') {
        this.strategyInfo.expression = this.strategyInfo.expression.replace(/\|/g, '&');
      } else if (value === 'OR') {
        this.strategyInfo.expression = this.strategyInfo.expression.replace(/&/g, '|');
      }
    },
    // 第一步删除规则块,删除block,原来方式
    subblock(num) {
      this.index = num;
      this.$refs.ruleBlock.forEach((item) => {
        item.subSave(); // 子组件保存内容到bus
      });
    },
    // subSave保存成功后回调,
    subOk() {
      // 每个模块均有返回,当全部模块返回完成时,将sub计数器重置
      this.sub += 1;
      if (this.sub === this.blockNum) {
        this.sub = 0;
        // 保存完成,进行删除操作
        this.blockNum -= 1;
        this.blockNumList.splice(this.index, 1);
        bus.buildRuleInfo.triggers.splice(this.index, 1);
        this.setLogic();
        this.$nextTick(() => {
          this.$refs.ruleBlock.forEach((item, index) => {
            // 将数据从bus重新赋值
            item.setSudata(index);
          });
        });
      }
    },
    // 获取后台数据并展示
    setDataList() {
      this.blockNum = bus.buildRuleInfo.triggers.length;
      this.blockNumList = new Array(this.blockNum).fill(1);
      this.$nextTick(() => {
        this.$refs.ruleBlock.forEach((item, index) => {
          // 将数据从bus重新赋值
          item.setMdata(index);
        });
      });
    },
    // 设置步骤状态
    setStepStatus(index, status) {
      this.$refs.stepsLoop.doneStep(index, status);
    },
    getSuggestMetric(param) {
      getSuggestMetric(param).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.metricList = res.data.metrics;
        } else {
          this.metricList = [];
        }
      });
    },
  },
  computed: {
    // 是否展示描述
    showDescription() {
      if (this.typeName === '模板') return true;
      return false;
    },
  },
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
      this.getSuggestMetric({
        product_id: this.productId,
      });
    } else {
      this.getSuggestMetric();
    }
  },
  beforeDestroy() {},
};

</script>
