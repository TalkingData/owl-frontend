<style lang="scss">
@import './build-step3.scss'

</style>
<template>
  <div class="build-step build-step3">
    <Row>
      <action-item :view-disable="viewDisable" ref="ruleBlock" 
      v-for="(item, index) in blockNumList" 
      :key="index"
      :num="index"
      :all-num="blockNumList.length"
      :user-groups="userGroups"
      :script-list="scriptList"
       @on-delete-block="subblock"
       @sub-save-ok="sub_ok"
       @on-vertify-success="getRuleBlockData"
       @on-open-change="openUserGroup"></action-item>
    </Row>
    <Row class="mt-10">
      <Button type="primary" icon="plus" @click="addblock" :disabled="viewDisable">添加告警方式</Button>
      <Alert style="width: 300px;" class="mt-10" type="warning" show-icon v-if="showMsg">请至少添加一组告警方式</Alert>
    </Row>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../../libs/bus';
import { getScripts, getUserGroups } from '../../../models/service';
import actionItem from './action-item';

export default {
  name: 'buildStep2',
  components: {
    actionItem,
  },
  props: {
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
        logic: 'AND', // 逻辑关系
        expression: 'A', // 自定义
        triggers: [], // 对应模块ruleBlock
        groups: [],
        hosts: [],
        actions: [],
      },
    },
  },
  data() {
    return {
      productId: '',
      groupArr: [], // 主机组
      desGroups: [], // 已选
      listStyle: {
        // width: '280px',
        height: '300px',
      },
      hostArr: [],
      desHosts: [],
      blockNumList: [1], // 模块数量ruleblock
      blockNum: 1, // 模块数量ruleblock
      index: -1, // 要删除的block, 标识想要删除的规则块
      sub: 0, // sub_save保存data到bus计数器
      stepFlag: false, // 步骤验证
      userGroups: [], // 用户组
      showMsg: false,
      scriptList: [],
    };
  },
  methods: {
    // 验证，并将数据返回
    vertifyStep() {
      this.showMsg = false;
      this.strategyInfo.actions = [];
      if (this.blockNumList.length) {
        this.$refs.ruleBlock.forEach((item, index) => {
          item.vertifyRuleBlock(index);
        });
      } else {
        this.showMsg = true;
      }
    },
    // 验证成功后,获取ruleblock数据
    getRuleBlockData(data) {
      this.strategyInfo.actions.push(data);
      if (this.strategyInfo.actions.length === this.blockNumList.length) {
        // 验证成功以后返回数据
        this.$emit('on-vertify-success', this.strategyInfo.actions, 'step3');
        this.stepFlag = true;
      } else {
        this.stepFlag = false;
      }
    },
    addblock() {
      this.showMsg = false;
      this.blockNum += 1;
      this.blockNumList.push(this.blockNum);
    },
    // 第一步删除规则块,删除block,原来方式
    subblock(num) {
      this.index = num;
      this.$refs.ruleBlock.forEach((item) => {
        // 子组件保存内容到bus
        item.sub_save();
      });
    },
    // sub_save保存成功后回调,
    sub_ok() {
      // 每个模块均有返回,当全部模块返回完成时,将sub计数器重置
      this.sub += 1;
      if (this.sub === this.blockNum) {
        this.sub = 0;
        // 保存完成,进行删除操作
        this.blockNum -= 1;
        this.blockNumList.splice(this.index, 1);
        bus.buildRuleInfo.actions.splice(this.index, 1);
        this.$nextTick(() => {
          this.$refs.ruleBlock.forEach((item, index) => {
            // 将数据从bus重新赋值
            item.set_sudata(index);
          });
        });
      }
    },
    // 获取后台数据并展示
    setDataList() {
      this.blockNum = bus.buildRuleInfo.actions.length;
      this.blockNumList = new Array(this.blockNum).fill(1);
      this.$nextTick(() => {
        this.$refs.ruleBlock.forEach((item, index) => {
          // 将数据从bus重新赋值
          item.set_sudata(index);
        });
      });
    },
    // 获取告警方式
    getScripts() {
      getScripts().then((res) => {
        if (res.status === 200) {
          this.scriptList = res.data.scripts;
        }
      });
    },
    // 获取用户组信息
    getUserGroups(product) {
      getUserGroups({
        paging: false,
        productId: product,
      }).then((res) => {
        if (res.status === 200) {
          this.userGroups = res.data.user_groups;
        }
      });
    },
    // 重新获取用户组
    openUserGroup() {
      this.getUserGroups(this.productId);
    },
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getScripts();
    this.getUserGroups(this.productId);
  },
  beforeDestroy() {},
};

</script>
