<style lang="scss">
@import './host-detail.scss'

</style>
<template>
  <div class="main-container host-detail">
    <div class="main-list-content">
      <div class="common-detail-top common-detail-top-fixed">
        <Row class="common-detail-top-item">
          <div class="float-left">
            <span title="返回到上级页面" @click="backTo" class="common-detail-top-title">返回上级&gt;</span>
            <span>&nbsp;主机名称 : {{hostItemInfo.hostname || '主机详情'}}</span>
          </div>
          <div class="float-right">
            <Tag @click.native="triggerApp('default')" 
            :color="getColor('default')">default</Tag>
            <Tag @click.native="triggerApp(item)" v-for="item in appList" 
            :key="item" :color="getColor(item)">{{item}}</Tag>
          </div>
        </Row>
        <Row class="common-detail-top-item">
          <div class="float-left">
            <calendar-select ref="calendar"
            @on-date-change="dateChange"
            placement="bottom-start"
            :refresh="true"></calendar-select>
          </div>
          <div class="float-right">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </Row>
      </div>
      <div class="table-list">
        <!-- <div class="table-list-header clearfix mb-10">
        </div> -->
        <div class="box-content">
          <line-chart-list 
          @on-remove-chart="removeData" ref="chartList"></line-chart-list>
        </div>
      </div>
    </div>
    <Modal title="移除图表" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除图表：<span>{{deleteObj.title}}&nbsp;吗？</span></Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { deleteCharts } from '../../models/service';
import paging from '../../components/page/paging';
import lineChartList from '../../components/monitor/line-chart-list';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'hostMetric',
  components: {
    paging,
    lineChartList,
    calendarSelect,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filter: { // 过滤条件
        productId: 0,
        hostId: 0,
        start_time: '',
        end_time: '',
        chartCount: 'multiple', // multiple,多图显示;single,单图显示
        prefix: 'default',
        load: 'refresh',
      },
      total: 0,
      startTime: '',
      endTime: '',
      hostId: 0,
      hostItemInfo: {}, // 主机信息
      removeModal: false, // 删除弹出
      deleteObj: {}, // 删除对象
      appList: [], // 主机分类列表
    };
  },
  methods: {
    backTo() {
      this.$router.go(-1);
    },
    triggerApp(name) {
      localStorage.setItem('hostAppname', name);
      if (this.filter.prefix === name) {
        this.filter.prefix = '';
      } else {
        this.filter.prefix = name;
      }
      this.filter.load = 'init';
      this.getData(this.filter);
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName.trim();
      this.filter.load = 'init';
      this.getData(this.filter);
    }, 1000),
    // 刷新
    reload() {
      this.$refs.calendar.reload();
      // this.getData(this.filter);
    },
    // 获取数据,用在子页面
    getData(params) {
      this.$refs.chartList.initData(params, this.hostItemInfo);
    },
    // 初始化获取数据
    getDetailData() {
      // 初始化时间
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      start.setSeconds(0);
      end.setSeconds(59);
      this.filter.start_time = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.end_time = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm:ss');
      // 获取id
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      this.hostId = this.$route.params.hostId; // 主机id
      const str = localStorage.getItem('hostItemInfo');
      const hostItemInfo = JSON.parse(str);
      this.appList = hostItemInfo.apps;
      this.hostItemInfo = hostItemInfo;
      this.filter.hostId = this.hostId;
      const hostAppname = localStorage.getItem('hostAppname');
      if (hostAppname) {
        this.filter.prefix = hostAppname;
      } else {
        this.filter.prefix = 'default';
      }
      this.filter.load = 'init';
      // filter中是productId和hostId
      this.getData(this.filter);
    },
    // 操作--------------------------------------------------------
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') {
          this.$Message.success('添加成功');
        } else {
          this.$Message.success('编辑成功');
        }
        this.filter.load = 'refresh';
        this.getData(this.filter);
      }
    },
    // 移除图表
    removeData(data) {
      this.deleteObj = data;
      this.removeModal = true;
    },
    // 删除图表确认
    deleteConfirm() {
      const params = {
        productId: this.filter.productId,
        hostId: this.hostId,
        chartId: this.deleteObj.id,
      };
      deleteCharts(params).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.filter.load = 'refresh';
          this.getData(this.filter);
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteObj = {};
    },
    // 修改时间
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.filter.load = 'refresh';
      this.getData(this.filter);
    },
    getColor(item) {
      if (item === this.filter.prefix) return 'blue';
      return 'default';
    },
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
    bus.$on('on-shrink-change', () => {
      this.$refs.chartList.refreshData();
    });
  },
  beforeDestroy() {
    bus.$off('on-shrink-change');
  },
};

</script>
