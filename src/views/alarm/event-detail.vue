<style lang="scss">
@import './event-detail.scss';

</style>
<template>
  <div class="brule event-detail">
    <div class="brule-top clearfix">
      <div class="float-left">
        <span title="返回到预警报警页" @click="backTo" class="brule-top-title">返回上级</span>
        <span>&gt;{{eventItem.strategy_name || '告警详情'}}</span>
      </div>
      <div class="float-right">
        <Button type="primary" @click="showResult">处理记录</Button>
      </div>
    </div>
    <div class="brule-margin">
      <div class="brule-body">
        <div class="brule-body-title">告警详情</div>
        <step-vertical-square ref="stepsLoop" :steps="stepsArr">
          <event-detail-block v-for="(item, index) in eventList" 
          :key="index" 
          :slot="'mainContent' + (index + 1)"
          :data="item"></event-detail-block>
        </step-vertical-square>
      </div>
    </div>
    <div class="add-more-alarm clearfix">
      <Button size="large" type="primary" @click="loadMore" icon="plus" :disabled="addDisabled">加载更多</Button>
    </div>
    <Modal v-model="showResultModal" title="处理记录" width="720px;" class="event-process-modal">
      <div class="event-process">
        <step-vertical-square ref="eventProcsss" :steps="eventProcessStep" v-if="eventProcess.length > 0">
          <Row v-for="(item, index) in eventProcess" 
          :key="index" 
          :slot="'mainContent' + (index + 1)">
            <Col span="12">
              <span>处理人：</span><span style="font-weight: bolder">{{item.process_user || '--'}}</span>
            </Col>
            <Col span="12">
              <span>操作：</span><span style="font-weight: bolder">{{item.process_comments}}</span>
            </Col>
          </Row>
        </step-vertical-square>
        <div v-else>暂无处理结果</div>
        <!-- <Table border size="small" :data="eventProcess" :columns="eventColumns"></Table> -->
      </div>
    </Modal>
  </div>
</template>
<script>
import { getEventInfo, getEventRecods } from '../../models/service';
import stepVerticalSquare from '../../components/step/step-vertical-square';
import stepVertical from '../../components/step/step-vertical';
import eventDetailBlock from '../../components/alarm/event-detail-block';

export default {
  name: 'alarmDetail',
  components: {
    stepVerticalSquare,
    stepVertical,
    eventDetailBlock,
  },
  props: {},
  data() {
    return {
      productId: '', // 产品线ID
      filter: {
        page: 1,
        page_size: 2,
        productId: '',
        id: '',
      },
      stepsArr: [], // 告警详情步骤
      stepFlag: false, // 步骤一验证
      eventInfoList: [], // 获取详情信息
      eventItem: {}, // 从列表页获取的event信息
      countIndex: 0, // 告警次数
      eventList: [], // 事件列表
      eventProcess: [], // 处理记录
      eventProcessStep: [], // 处理记录时间轴
      eventColumns: [{
        title: '时间',
        key: 'process_time',
      }, {
        title: '处理人',
        key: 'process_user',
      }, {
        title: '操作',
        key: 'process_comments',
      }],
      showResultModal: false,
      eventId: '',
      scriptList: [],
      total: 0,
    };
  },
  methods: {
    backTo() {
      this.$router.go(-1);
      // this.$router.push({
      //   path: `/alarm/event/list/${this.productId}`,
      // });
    },
    // 查看告警结果
    showResult() {
      this.showResultModal = true;
      this.getEventRecods({
        id: this.eventItem.id,
      });
    },
    stepChange() {
    },
    // 设置步骤状态
    setStepStatus(index, status) {
      this.$refs.stepsLoop.doneStep(index, status);
    },
    // 更多
    loadMore() {
      this.filter.page = this.filter.page + 1;
      this.getEventInfo(this.filter);
      // this.getEventList();
    },
    pageChange(current) {
      this.filter.page = current;
      this.getEventInfo(this.filter);
    },
    getEventList() {
      if (this.eventList.length < this.countIndex) {
        // 剩余告警事件
        const leftLength = this.countIndex - this.eventList.length;
        // 本次需要请求次数
        const toGetNum = leftLength > 5 ? 5 : leftLength;
        let countArr = new Array(toGetNum).fill(0);
        countArr = countArr.map((item, index) => leftLength - index);
        this.getEventInfo({
          id: this.eventItem.id,
          count: countArr,
        });
      }
    },
    // 获取详细信息
    getEventInfo(params) {
      const param = JSON.parse(JSON.stringify(params));
      getEventInfo(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          res.data.records.forEach((item) => {
            this.eventList.push(item);
            // 3关闭,绿色
            const statusClass = item.strategy_event.status === 3 ? 'success' : '';
            const step = {
              title: item.strategy_event.update_time,
              isOpen: true,
              num: item.strategy_event.count,
              status: statusClass,
            };
            this.stepsArr.push(step);
          });
        }
      });
    },
    // 初始化,设置详情信息
    getDetailData() {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
        this.filter.productId = this.productId;
      }
      const eventItem = localStorage.getItem('eventItem');
      this.eventItem = JSON.parse(eventItem);
      this.filter.id = this.eventItem.id;
      this.getEventInfo(this.filter);
    },
    // 获取处理结果信息
    getEventRecods(params) {
      const param = Object.assign({}, params);
      param.productId = this.productId;
      getEventRecods(param).then((res) => {
        if (res.status === 200) {
          this.eventProcess = res.data.events_process;
          const len = res.data.events_process.length;
          this.eventProcessStep = res.data.events_process.map((item, index) => {
            const step = {
              title: item.process_time,
              isOpen: true,
              num: len - index,
            };
            return step;
          });
        }
      });
    },
  },
  computed: {
    headerTitle() {
      return '告警详情';
    },
    addDisabled() {
      return this.total <= this.eventList.length;
    },
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
