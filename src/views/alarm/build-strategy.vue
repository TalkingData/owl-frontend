<style lang="scss">
@import './build-strategy.scss'

</style>
<template>
  <div class="brule build-rule">
    <div class="brule-top clearfix">
      <div class="float-left">
        <span title="返回到预警报警页" @click="backTo" class="brule-top-title">策略列表</span>
        <span>&gt;{{headerTitle}}</span>
      </div>
      <div class="float-right" v-if="viewDisable">
        <Button type="primary" @click="editRule">编辑策略</Button>
      </div>
      <div class="float-right" v-else>
        <Button type="primary" @click="selectTemplate">选择模板</Button>
      </div>
    </div>
    <Form class="brule-margin" label-position="left">
      <div class="brule-body">
        <step-vertical ref="stepsLoop" :steps="stepsArr">
          <div slot="mainContent1">
            <buildStep1 :view-disable="viewDisable" :strategy-info="strategyInfo" @on-vertify-success="getInfo" ref="step1"></buildStep1>
          </div>
          <div slot="mainContent2">
            <buildStep2 :view-disable="viewDisable" :strategy-info="strategyInfo" @on-vertify-success="getInfo" ref="step2"></buildStep2>
          </div>
          <div slot="mainContent3">
            <buildStep3 :view-disable="viewDisable" :strategy-info="strategyInfo" @on-vertify-success="getInfo" ref="step3"></buildStep3>
          </div>
        </step-vertical>
      </div>
    </Form>
    <div class="clearfix mb-20">
      <div class="float-right pr-50">
        <Button type="primary" @click="saveBuild" :disabled="viewDisable">保存</Button>
      </div>
    </div>
    <select-template ref="selectTemplate" @on-create-success="setTemplate"></select-template>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../libs/bus';
import { getStrategyInfo, addStrategie, updateStrategie } from '../../models/service';
import stepVertical from '../../components/step/step-vertical';
import buildStep1 from '../../components/alarm/buildrule/build-step1';
import buildStep2 from '../../components/alarm/buildrule/build-step2';
import buildStep3 from '../../components/alarm/buildrule/build-step3';
import selectTemplate from '../../components/alarm/select-template';

export default {
  name: 'buildRule',
  components: {
    stepVertical,
    buildStep1,
    buildStep2,
    buildStep3,
    selectTemplate,
  },
  props: {},
  data() {
    return {
      productId: '',
      stepsArr: [{ title: '编辑预警条件', isOpen: true }, { title: '选择预警设备', isOpen: true }, { title: '指定告警对象', isOpen: true }],
      // 告警信息
      strategyInfo: {
        name: '',
        enable: 1,
        // description: '',
        priority: 1, // 告警级别
        alarm_count: 5, // 告警次数
        cycle: 5, // 追溯时间
        logic: 'AND', // 逻辑关系
        expression: 'A', // 自定义
        triggers: [], // 对应模块ruleBlock
        groups: [], // 主机组
        exclude_hosts: [], // 排除主机
        actions: [], // 告警方式
      },
      stepFlag: false, // 步骤一验证
      eruleInfo: {}, // 获取详情信息
      // 传递给后台的数据
      strategyParams: {},
      // 步骤校验计数
      stepCount: 0,
      strategyId: 0,
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/alarm/strategy/list/${this.productId}`,
      });
    },
    // 启用编辑策略
    editRule() {
      const strategy = this.$route.params.strategyId;
      this.$router.push({
        path: `/alarm/erule/${strategy}/${this.productId}`,
      });
    },
    // 设置步骤状态
    setStepStatus(index, status) {
      this.$refs.stepsLoop.doneStep(index, status);
    },
    // 保存,开始校验
    saveBuild() {
      this.stepCount = 0;
      this.$refs.step1.vertifyStep();
      this.$refs.step2.vertifyStep();
      this.$refs.step3.vertifyStep();
    },
    // 校验成功后的数据，进行拼装
    getInfo(info, step) {
      if (step === 'step1') {
        const strategyParams = JSON.parse(JSON.stringify(info));
        const arr = Object.keys(strategyParams);
        arr.forEach((item) => {
          if (item !== 'actions' && item !== 'groups' && item !== 'exclude_hosts') {
            this.strategyParams[item] = strategyParams[item];
          }
        });
      } else if (step === 'step2') {
        const groupHost = JSON.parse(JSON.stringify(info));
        this.strategyParams.groups = groupHost.groups;
        this.strategyParams.exclude_hosts = groupHost.exclude_hosts;
      } else if (step === 'step3') {
        const actionArr = JSON.parse(JSON.stringify(info));
        this.strategyParams.actions = actionArr.map((item) => {
          const action = item;
          delete action.timeRange;
          return action;
        });
      }
      this.stepCount += 1;
      if (this.stepCount === 3) {
        this.stepCount = 0;
        delete this.strategyParams.product_id;
        delete this.strategyParams.user_id;
        if (this.path === 'brule' || this.path === 'crule') {
          this.strategyParams.enable = this.strategyInfo.enable;
          this.addStrategie(this.strategyParams);
        } else if (this.path === 'erule') {
          // 编辑策略
          this.strategyParams.id = this.strategyId;
          this.strategyParams.enable = this.strategyInfo.enable;
          this.updateStrategie(this.strategyParams);
        }
      }
    },
    // 新建策略
    addStrategie(params) {
      const param = JSON.parse(JSON.stringify(params));
      param.productId = this.productId;
      addStrategie(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            bus.backtoRulelist = '创建成功';
            this.backTo();
          }
        } else {
          let msg = 'error';
          if (res.data) {
            msg = res.data.message ? res.data.message : 'error';
          }
          this.$Message.error({
            content: `创建失败:${msg}`,
            duration: 5,
          });
        }
      });
    },
    // 升级策略
    updateStrategie(params) {
      const param = JSON.parse(JSON.stringify(params));
      param.productId = this.productId;
      updateStrategie(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            bus.backtoRulelist = '修改成功';
            this.backTo();
          }
        } else {
          let msg = 'error';
          if (res.data) {
            msg = res.data.message ? res.data.message : 'error';
          }
          this.$Message.error(`修改失败:${msg}`);
        }
      });
    },
    // 将后台拿到的“k1=v1,k2=v2...”转为[{key:k1,value:v1},{key:k2,value:v2}....]
    proTags(data) {
      const dou = data.indexOf(',');
      const tmp = [];
      if (dou === -1) {
        const set = data.split('=');
        if (set.length > 1) {
          const valueArr = set[1].split('|');
          valueArr.forEach((keyV) => {
            tmp.push({
              key: set[0],
              value: keyV,
            });
          });
        }
      } else {
        const mid = data.split(','); // ['key=v1','key=v2',....]
        mid.forEach((item) => {
          const setInner = item.split('=');
          if (setInner.length > 1) {
            const valueArr = setInner[1].split('|');
            valueArr.forEach((keyV) => {
              tmp.push({
                key: setInner[0],
                value: keyV,
              });
            });
          }
        });
      }
      return tmp;
    },
    // 获取策略信息
    getStrategyInfo(params) {
      getStrategyInfo(params).then((res) => {
        if (res.status === 200) {
          this.getDetailData(res.data);
        }
      });
    },
    // 设置详情信息
    getDetailData(ruleInfo) {
      this.strategyId = parseInt(this.$route.params.strategyId, 10);
      bus.buildRuleInfo.triggers = [];
      bus.buildRuleInfo.actions = [];
      const path = this.$route.path.split('/')[2];
      this.eruleInfo = ruleInfo.strategy;
      // 设置步骤一信息,策略信息,先将字符串和数字类取出
      const infoKeys = Object.keys(ruleInfo.strategy);
      infoKeys.forEach((item) => {
        if (typeof ruleInfo.strategy[item] === 'string' || typeof ruleInfo.strategy[item] === 'number') {
          this.strategyInfo[item] = ruleInfo.strategy[item];
        }
      });
      // 设置步骤一信息, trigger信息
      // this.strategyInfo.triggers = JSON.parse(JSON.stringify(ruleInfo.strategy.triggers));
      let triggerArr = JSON.parse(JSON.stringify(ruleInfo.strategy.triggers));
      triggerArr = triggerArr.map((item) => {
        const obj = item;
        obj.tags = this.proTags(obj.tags);
        return obj;
      });
      bus.buildRuleInfo.triggers = triggerArr;
      // 步骤二信息
      this.strategyInfo.groups = ruleInfo.strategy.groups;
      this.strategyInfo.exclude_hosts = ruleInfo.strategy.exclude_hosts;
      // 设置步骤三信息
      // this.strategyInfo.actions = JSON.parse(JSON.stringify(ruleInfo.strategy.actions));
      let actionsArr = JSON.parse(JSON.stringify(ruleInfo.strategy.actions));
      actionsArr = actionsArr.map((item) => {
        const obj = item;
        if (path === 'crule') {
          delete obj.strategy_id;
          delete obj.ID;
        }
        obj.script_id = obj.script ? obj.script.id : 1;
        obj.timeRange = [obj.begin_time.slice(0, 5), obj.end_time.slice(0, 5)];
        obj.type = obj.type === 1;
        obj.user_groups = obj.user_groups.map(group => group.id);
        return obj;
      });
      bus.buildRuleInfo.actions = actionsArr;
      // 触发步骤一中数据展示
      this.$refs.step1.setDataList();
      // 触发步骤二中数据展示
      this.$refs.step2.setDataList();
      // 触发步骤三中数据展示
      this.$refs.step3.setDataList();
      // 设置策略名称信息
      if (path === 'crule') {
        this.strategyInfo.name = `${this.eruleInfo.name}_clone`;
      }
    },
    setTemplate(msg, data) {
      if (data.code === 200) {
        bus.buildRuleInfo.triggers = [];
        this.eruleInfo = data.template;
        // 设置步骤一信息,策略信息
        const infoKeys = Object.keys(data.template);
        infoKeys.forEach((item) => {
          if (typeof data.template[item] === 'string' || typeof data.template[item] === 'number') {
            this.strategyInfo[item] = data.template[item];
          }
        });
        // 设置步骤一信息, trigger信息
        let triggerArr = JSON.parse(JSON.stringify(data.template.triggers));
        triggerArr = triggerArr.map((item) => {
          const obj = item;
          obj.tags = this.proTags(obj.tags);
          return obj;
        });
        bus.buildRuleInfo.triggers = triggerArr;
        // 触发步骤一中数据展示
        this.$refs.step1.setDataList();
      }
    },
    // 选择模板
    selectTemplate() {
      this.$refs.selectTemplate.editInit('edit');
    },
  },
  computed: {
    headerTitle() {
      const path = this.$route.path.split('/')[2];
      if (path === 'brule') return '新建策略';
      if (path === 'erule') return '编辑策略';
      if (path === 'vrule') return '查看策略';
      if (path === 'crule') return '克隆策略';
      return '策略详情';
    },
    path() {
      return this.$route.path.split('/')[2];
    },
    // 查看状态下,不能编辑
    viewDisable() {
      const path = this.$route.path.split('/')[2];
      if (path === 'vrule') return true;
      return false;
    },
  },
  mounted() {
    if (this.$route.params.strategyId && this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
      this.getStrategyInfo({
        productId: this.productId,
        id: parseInt(this.$route.params.strategyId, 10),
      });
    } else if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
    }
  },
  beforeDestroy() {
  },
};

</script>
