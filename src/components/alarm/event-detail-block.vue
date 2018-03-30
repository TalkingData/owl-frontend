<style lang="scss">
@import './event-detail-block.scss'

</style>
<template>
  <div class="event-detail-box">
    <div class="event-detail-block" :class="[{'close': isClose}, {'success': data.strategy_event.status === 3}]">
      <div class="event-detail-title">
        <span>报警详情</span>
      </div>
      <Row v-for="(item, index) in data.trigger_events" :key="index">
        <rule-block :data="item"></rule-block>
      </Row>
      <Row class="event-detail-item">
        <Col span="2">
          <div class="float-item">通知</div>
        </Col>
        <Col span="22">
        <!-- v-if="item.action_kind === 1" -->
          <div class="float-left mr-10" v-for="(item, key) in actionResults" :key="key">
            <Button @click="showAlarmUser(item)" :class="[item.success ? 'success' : 'failure']">{{key}}</Button>
          </div>
        </Col>
      </Row>
      <Row class="event-detail-item" v-if="hasAlarmResult">
        <Col span="2">
          <div class="float-item">执行</div>
        </Col>
        <Col span="22">
          <div class="float-left mr-10" v-for="(item, index) in data.action_results" v-if="item.action_kind === 2">
            <Button @click="showAction(item)" :class="[item.success ? 'success' : 'failure']">{{item.script_name}}</Button>
          </div>
        </Col>
      </Row>
      <Modal v-model="showUserModal" title="通知详情" class="show-user-modal" :class="[showUserInfo.success ? 'success' : 'failure']">
        <div class="show-user-title clearfix">
          <div class="float-left">
            <Select v-model="actionType" 
            style="width: 100px;" 
            @on-change="selectScript"
            label-in-value>
              <Option v-for="type in alarmList" 
              :label="type.script_name"
              :value="type.script_id"
              :key="type.script_id">{{type.script_name}}</Option>
            </Select>
          </div>
          <div class="float-right">
            {{showUserInfo.file_path}}
          </div>
        </div>
        <div>
          <div class="show-content-title">{{showUserInfo.subject}}</div>
          <Input v-if="showUserInfo.success" readonly type="textarea" :autosize="{minRows: 2}" v-model="showUserInfo.content"></Input>
          <Input v-else readonly type="textarea" :autosize="{minRows: 2}" v-model="showUserInfo.response"></Input>
        </div>
      </Modal>
      <Modal v-model="showActionModal" title="告警动作详情" class="show-user-modal" :class="[showUserInfo.success ? 'success' : 'failure']">
        <div class="show-user-title clearfix">
          <div class="float-left">
            <span class="show-user-title-label mr-10">{{showUserInfo.script_name}}:</span><span>{{showUserInfo.file_path}}</span>
          </div>
        </div>
        <div>
          <Input readonly type="textarea" :autosize="{minRows: 2}" v-model="showUserInfo.response"></Input>
        </div>
      </Modal>
    </div>
    <!-- <div class="view-all-btn">
      <a @click="showAll">{{closeWord}}</a>
    </div> -->
  </div>
</template>
<script>
// import _ from 'lodash';
// import bus from '../../../libs/bus';
// import { getScripts } from '../../models/service';
import ruleBlock from './buildrule/rule-block';

export default {
  name: 'eventDetail',
  components: {
    ruleBlock,
  },
  props: {
    data: {
      type: Object,
      default: () => {},
    },
    // scriptList: {
    //   type: Array,
    //   default: () => [],
    // },
  },
  data() {
    return {
      showUserModal: false, // 展示通知信息
      showActionModal: false, // 展示执行详情
      showUserInfo: {}, // 展示通知信息
      actionType: '', // 通知展示告警方式类别
      actionTypeName: '',
      isClose: true, // 默认展示部分信息
      alarmUserData: {}, // 保存多个告警信息
      alarmList: [],
    };
  },
  methods: {
    // 查看通知详情
    showAlarmUser(data) {
      this.alarmUserData = data;
      this.alarmList = data.data;
      if (data.data.length) {
        this.showUserInfo = data.data[0];
        this.actionType = data.data[0].script_id;
      }
      this.showUserModal = true;
    },
    // 查看告警动作详情
    showAction(user) {
      this.showUserInfo = user;
      this.showActionModal = true;
    },
    // 展开or关闭本框
    showAll() {
      this.isClose = !this.isClose;
    },
    // 脚本查看
    selectScript(obj) {
      if (obj.value) {
        const script = this.alarmList.find(item => item.script_id === obj.value);
        this.showUserInfo = script;
      } else {
        this.showUserInfo = {};
      }
    },
  },
  computed: {
    closeWord() {
      if (this.isClose) return '更多>>';
      return '关闭<<';
    },
    // 是否有告警动作
    hasAlarmResult() {
      const arr = this.data.action_results.filter(item => item.action_kind === 2);
      return arr.length > 0;
    },
    // 返回的操作结果，告警信息,同一个通知的情况下,将数据合并
    actionResults() {
      const res = {};
      this.data.action_results.forEach((item) => {
        // action_kind:1通知，2执行
        if (item.action_kind === 1) {
          if (!res[item.username]) {
            res[item.username] = {
              success: item.success,
              data: [],
            };
            res[item.username].data.push(item);
          } else {
            res[item.username].success = res[item.username].success && item.success;
            res[item.username].data.push(item);
          }
        }
      });
      return res;
    },
  },
  watch: {
  },
  mounted() {
  },
  beforeDestroy() {},
};

</script>
