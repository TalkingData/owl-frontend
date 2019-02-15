<style lang="scss">
@import './create-template.scss';

</style>
<template>
  <div class="brule create-template">
    <div class="brule-top clearfix">
      <div class="float-left">
        <span title="返回到模板列表页" @click="backTo" class="brule-top-title">模板列表</span>
        <span>&gt;{{headerTitle}}</span>
      </div>
      <div class="float-right" v-if="viewDisable">
        <Button type="primary" @click="editRule">编辑模板</Button>
      </div>
    </div>
    <Form class="brule-margin" label-position="left">
      <div class="brule-body">
        <buildStep1 
        :view-disable="viewDisable"
        :strategy-info="strategyInfo"
        type-name="模板"
        @on-vertify-success="getInfo" 
        ref="step1"></buildStep1>
      </div>
    </Form>
    <div class="clearfix mb-20">
      <div class="float-right pr-50">
        <Button type="primary" @click="saveBuild" :disabled="viewDisable">保存</Button>
      </div>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../libs/bus';
import { getTemplateInfo, addTemplate, updateTemplate } from '../../models/service';
import buildStep1 from '../../components/alarm/buildrule/build-step1';

export default {
  name: 'buildRule',
  components: {
    buildStep1,
  },
  props: {},
  data() {
    return {
      stepsArr: [{ title: '编辑预警条件', isOpen: true }, { title: '选择预警设备', isOpen: true }, { title: '指定告警对象', isOpen: true }],
      // 告警信息
      strategyInfo: {
        name: '',
        description: '',
        priority: 1, // 告警级别
        alarm_count: 5, // 告警次数
        cycle: 5, // 追溯时间
        logic: 'OR', // 逻辑关系
        expression: 'A', // 自定义
        triggers: [], // 对应模块ruleBlock
      },
      stepFlag: false, // 步骤一验证
      eruleInfo: {}, // 获取详情信息
      // 传递给后台的数据
      strategyParams: {},
      // 步骤校验计数
      stepCount: 0,
      templateId: 0,
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: '/admin/template/list',
      });
    },
    // 启用编辑模板
    editRule() {
      const strategy = this.$route.params.templateId;
      this.$router.push({
        path: `/admin/template/edit/${strategy}`,
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
      }
      this.stepCount += 1;
      if (this.stepCount === 1) {
        this.stepCount = 0;
        delete this.strategyParams.product_id;
        delete this.strategyParams.user_id;
        delete this.strategyParams.enable;
        if (this.path === 'create' || this.path === 'clone') {
          this.addTemplate(this.strategyParams);
        } else if (this.path === 'edit') {
          // 编辑模板
          this.strategyParams.id = this.templateId;
          this.updateTemplate(this.strategyParams);
        }
      }
    },
    // 新建模板
    addTemplate(params) {
      const param = JSON.parse(JSON.stringify(params));
      param.triggers.forEach((item) => {
        // eslint-disable-next-line
        item.tags = this.tagsToString(item.tagList);
        // eslint-disable-next-line
        delete item.tagList;
      });
      addTemplate(param).then((res) => {
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
    // 升级模板
    updateTemplate(params) {
      const param = JSON.parse(JSON.stringify(params));
      param.triggers.forEach((item) => {
        // eslint-disable-next-line
        item.tags = this.tagsToString(item.tagList);
        // eslint-disable-next-line
        delete item.tagList;
      });
      updateTemplate(param).then((res) => {
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
    // tags字符串拼接
    tagsToString(arr) {
      let str = '';
      arr.forEach((item, index) => {
        if (index === 0) {
          str += `${item.name}=${item.value.join('|')}`;
        } else {
          str += `,${item.name}=${item.value.join('|')}`;
        }
      });
      return str;
    },
    // 获取模板信息
    getTemplateInfo(params) {
      getTemplateInfo(params).then((res) => {
        if (res.status === 200) {
          this.getDetailData(res.data);
        }
      });
    },
    // 设置详情信息
    getDetailData(ruleInfo) {
      this.templateId = parseInt(this.$route.params.templateId, 10);
      bus.buildRuleInfo.triggers = [];
      const path = this.$route.path.split('/')[3];
      this.eruleInfo = ruleInfo.template;
      // 设置步骤一信息,模板信息
      const infoKeys = Object.keys(ruleInfo.template);
      infoKeys.forEach((item) => {
        if (typeof ruleInfo.template[item] === 'string' || typeof ruleInfo.template[item] === 'number') {
          this.strategyInfo[item] = ruleInfo.template[item];
        }
      });
      if (ruleInfo.template.expression && ruleInfo.template.expression.indexOf('&&') > -1) {
        this.strategyInfo.logic = 'AND';
      } else {
        this.strategyInfo.logic = 'OR';
      }
      // 设置步骤一信息, trigger信息
      let triggerArr = JSON.parse(JSON.stringify(ruleInfo.template.triggers));
      triggerArr = triggerArr.map((item) => {
        const obj = item;
        obj.tagList = [];
        return obj;
      });
      bus.buildRuleInfo.triggers = triggerArr;
      // 触发步骤一中数据展示
      this.$refs.step1.setDataList();
      // 设置模板名称信息
      if (path === 'clone') {
        this.strategyInfo.name = `${this.eruleInfo.name}_clone`;
      }
    },
  },
  computed: {
    headerTitle() {
      const path = this.$route.path.split('/')[3];
      if (path === 'create') return '新建模板';
      if (path === 'detail') return '模板详情';
      if (path === 'edit') return '编辑模板';
      if (path === 'clone') return '克隆模板';
      return '模板详情';
    },
    path() {
      return this.$route.path.split('/')[3];
    },
    // 查看状态下,不能编辑
    viewDisable() {
      const path = this.$route.path.split('/')[3];
      if (path === 'detail') return true;
      return false;
    },
  },
  mounted() {
    if (this.$route.params.templateId) {
      this.getTemplateInfo({
        templateId: parseInt(this.$route.params.templateId, 10),
      });
    }
  },
  beforeDestroy() {
  },
};

</script>
