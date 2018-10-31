<style lang="scss">
@import './action-item.scss'

</style>
<template>
  <div class="action-item-view">
    <Form :model="data" ref="actionItem">
      <Row>
        <Col span="22" class="metric-main">
          <div class="float-left metric-block mr-10">
            <Select v-model="data.kind" style="width: 100px;" :disabled="viewDisable">
              <Option :value="1">通知</Option>
              <Option :value="2">动作</Option>
            </Select>
          </div>
          <div class="float-left metric-block mr-5">方式</div>
          <div class="float-left">
            <FormItem prop="script_id" :rules="{ required: true, type: 'number', trigger: 'change', message: '请选择告警方式'}">
              <Select v-model="data.script_id" style="width: 100px;" :disabled="viewDisable">
                <Option v-for="type in scriptList" 
                :value="type.id"
                :key="type.id">{{type.name}}</Option>
              </Select>
            </FormItem>
          </div>
          <div class="float-left metric-block ml-10 mr-5">时间</div>
          <div class="float-left">
            <FormItem prop="timeRange" :rules="{required: true, type: 'array', min: 2, trigger: 'change', message: '请选择起止时间'}">
               <TimePicker 
                confirm 
                type="timerange" 
                placeholder="选择开始结束时间" 
                format="HH:mm"
                :editable="false"
                :clearable="false"
                v-model="data.timeRange"
                @on-change="getTime"
                @on-clear="getTime"
                :readonly="viewDisable"
                ></TimePicker>
            </FormItem>
          </div>
          <div v-if="num > 0" class="float-left metric-block ml-10 mr-5">延迟(分钟)</div>
          <div v-if="num > 0" class="float-left">
            <FormItem prop="time_period" :rules="{required: true, type: 'number', trigger: 'change', message: '请填写延迟时间'}">
              <InputNumber v-model="data.time_period" :min="0" :readonly="viewDisable">
              </InputNumber>
            </FormItem>
          </div>
          <div class="float-left metric-block ml-10 mr-5" v-if="data.kind == 1">告警通知</div>
          <div class="float-left metric-block" v-if="data.kind == 1">
            <Poptip placement="top" width="300">
              <Input v-model="data.alarm_subject" :readonly="viewDisable"></Input>
              <Row slot="title">
                <div class="float-left">报警内容</div>
                <div class="float-right">
                  <Poptip placement="bottom-start" width="300">
                    <Icon class="cursor-pointer" type="help-circled" size="16"></Icon>
                    <div slot="title">报警内容说明</div>
                    <div slot="content">
                      <pre><code>{{helpAtext}}</code></pre>
                    </div>
                  </Poptip>
                </div>
              </Row>
              <div slot="content">
                <Input v-model="data.alarm_template" :readonly="viewDisable" type="textarea" :autosize="{minRows: 2,maxRows: 15}"></Input>
              </div>
            </Poptip>
          </div>
          <div class="float-left metric-block ml-10 mr-5" v-if="data.kind == 1">
            <Checkbox v-model="data.type" :disabled="viewDisable">是否发送恢复通知</Checkbox>
          </div>
          <div class="float-left metric-block ml-10 mr-5" v-if="data.kind == 1 && data.type">恢复通知</div>
          <div class="float-left metric-block" v-if="data.kind == 1 && data.type">
            <Poptip placement="top" width="300">
              <Input v-model="data.restore_subject" :readonly="viewDisable"></Input>
              <Row slot="title">
                <div class="float-left">恢复信息</div>
                <div class="float-right">
                  <Poptip placement="bottom" width="300">
                    <Icon class="cursor-pointer" type="help-circled" size="16"></Icon>
                    <div slot="title">恢复信息说明</div>
                    <div slot="content">
                      <pre><code>{{helpRtext}}</code></pre>
                    </div>
                  </Poptip>
                </div>
              </Row>
              <div slot="content">
                <Input v-model="data.restore_template" 
                type="textarea" 
                :autosize="{minRows: 2,maxRows: 15}"
                :readonly="viewDisable"></Input>
              </div>
            </Poptip>
          </div>
        </Col>
        <Col span="2">
          <div class="float-right">
            <Button icon="ios-trash" v-show="allNum > 1" @click="deleteBlock" :disabled="viewDisable"></Button>
          </div>
        </Col>
      </Row>
      <!-- // 1 通知，2 动作 -->
      <Row v-if="data.kind === 1">
        <FormItem label="告警人员" :label-width="70" prop="user_groups" :rules="{required: true, type: 'array', min: 1, trigger: 'change', message: '请选择告警人员'}">
          <Select class="show-x" 
          multiple filterable 
          v-model="data.user_groups" 
          placeholder="请选择人员组"
          :disabled="viewDisable"
          @click.native="openGroup"
          @on-open-change="openGroup">
            <Option v-for="item in userGroups" :key="item.id" :label="item.name" :value="item.id">
              {{item.name}}
            </Option>
          </Select>
        </FormItem>
      </Row>
    </Form>
  </div>
</template>
<script>
// import _ from 'lodash';
import bus from '../../../libs/bus';
// import { getSuggestValue } from '../../../models/service';

export default {
  name: 'actionItem',
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
    userGroups: {
      type: Array,
      default: () => [],
    }, // 用户组
    scriptList: {
      type: Array,
      default: () => [],
    },
    allNum: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      // action数据集合
      data: {
        script_id: 1, // 告警方式
        type: false, // 1 需要恢复信息， 0 不需要恢复
        begin_time: '00:00:00',
        end_time: '23:59:59',
        timeRange: ['00:00', '23:59'], // 开始结束时间
        time_period: 0, // 延迟时间
        alarm_subject: '告警信息', // 告警标题
        alarm_template: '', // 告警信息
        restore_subject: '恢复信息', // 恢复标题
        restore_template: '', // 恢复信息
        user_groups: [],
        kind: 1, // action方式, 1 通知，2 动作
      },
      // 告警方式
      sendTypeArr: [{
        value: 1,
        name: '邮件',
      }, {
        value: 2,
        name: '短信',
      }, {
        value: 3,
        name: '微信',
      }, {
        value: 4,
        name: '电话',
      }],
      atext: '告警主机:{{.HOST.NAME}}\n主机地址:{{.HOST.IP}}\n追溯时间:{{.STRATEGY.CYCLE}}分钟\n告警时间:{{.STRATEGY.UPDATE_TIME}}\n告警等级:{{.STRATEGY.PRIORITY}}\n表达式:{{.STRATEGY.EXPRESSION}}\n表达式详细:{{.STRATEGY.EXPRESSION_DETAIL}}\n当前状态:{{.STRATEGY.STATUS}}\n事件ID:{{.STRATEGY.ID}}',
      rtext: '恢复主机:{{.HOST.NAME}}\n主机地址:{{.HOST.IP}}\n追溯时间:{{.STRATEGY.CYCLE}}分钟\n恢复时间:{{.STRATEGY.UPDATE_TIME}}\n告警等级:{{.STRATEGY.PRIORITY}}\n表达式:{{.STRATEGY.EXPRESSION}}\n表达式详细:{{.STRATEGY.EXPRESSION_DETAIL}}\n当前状态:{{.STRATEGY.STATUS}}\n事件ID:{{.STRATEGY.ID}}',
      helpAtext: '{{.HOST.NAME}} — 告警主机的主机名\n{{.HOST.IP}} — 告警主机的IP地址\n{{.STRATEGY.CYCLE}} — 告警策略的追溯时间（分钟）\n{{.STRATEGY.UPDATE_TIME}} — 告警的触发时间\n{{.STRATEGY.EXPRESSION}} — 告警策略的逻辑表达式 （A && B...）\n{{.STRATEGY.EXPRESSION_DETAIL}} — 告警策略的详细表达式\n{{.STRATEGY.STATUS}} — 告警当前状态（活跃报警）\n{{.STRATEGY.ID}} — 告警事件的唯一ID\n',
      helpRtext: '{{.HOST.NAME}} — 恢复主机的主机名\n{{.HOST.IP}} — 恢复主机的IP地址\n{{.STRATEGY.CYCLE}} — 恢复策略的追溯时间（分钟）\n{{.STRATEGY.UPDATE_TIME}} — 恢复的触发时间\n{{.STRATEGY.EXPRESSION}} — 恢复策略的逻辑表达式 （A && B...）\n{{.STRATEGY.EXPRESSION_DETAIL}} — 恢复策略的详细表达式\n{{.STRATEGY.STATUS}} — 恢复当前状态（活跃报警）\n{{.STRATEGY.ID}} — 恢复事件的唯一ID\n',
    };
  },
  methods: {
    // 获取起止时间
    getTime(value) {
      if (value) {
        this.data.begin_time = `${value[0]}:00`;
        this.data.end_time = `${value[1]}:59`;
      } else {
        this.data.begin_time = '';
        this.data.end_time = '';
      }
    },
    // 删除block
    deleteBlock() {
      this.$emit('on-delete-block', this.num);
    },
    // on-delete-block回调，删除时保存所有规则块的数据
    sub_save() {
      bus.buildRuleInfo.actions[this.num] = this.data;
      this.$emit('sub-save-ok');
    },
    // 重新赋值,sub-save-ok回调
    set_sudata(index) {
      if (index === this.num) {
        this.data = bus.buildRuleInfo.actions[this.num];
        if (this.data.begin_time && this.data.end_time) {
          this.data.timeRange = [this.data.begin_time.slice(0, 5), this.data.end_time.slice(0, 5)];
        }
      }
    },
    // 触发验证,验证填写内容
    vertifyRuleBlock(index) {
      if (this.num === index) {
        this.$refs.actionItem.validate((valid) => {
          if (valid) {
            const params = JSON.parse(JSON.stringify(this.data));
            params.type = params.type ? 1 : 0;
            params.user_groups = params.user_groups.map((item) => {
              const obj = {
                user_group_id: item,
              };
              return obj;
            });
            // 验证成功以后,将结果返回父级统一处理
            this.$emit('on-vertify-success', params, this.num);
          }
        });
      }
    },
    openGroup(val) {
      if (val) {
        this.$emit('on-open-change');
      }
    },
  },
  computed: {
    // disabledMinuteEnd: {
    //   get() {
    //     if (this.data.begin_time) {
    //       const start = this.data.begin_time.split(':');
    //       if (this.data.end_time) {
    //       }
    //       return [];
    //     }
    //     return [];
    //   },
    //   set() {},
    // },
  },
  watch: {
    userGroups(valArray) {
      if (this.data.user_groups.length > 0) {
        const arr = this.data.user_groups.filter((idItem) => {
          const obj = valArray.find(item => idItem === item.id);
          return !!obj;
        });
        this.data.user_groups = arr;
      }
    },
  },
  mounted() {
    this.data.alarm_template = this.atext;
    this.data.restore_template = this.rtext;
  },
  beforeDestroy() {},
};

</script>
