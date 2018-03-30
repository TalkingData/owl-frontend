<style lang="scss">
@import './panel-detail.scss'

</style>
<template>
  <div class="main-container panel-detail">
    <div class="main-list-content">
      <div class="common-detail-top common-detail-top-fixed">
        <div class="common-detail-top-item clearfix">
          <div class="float-left">
            <span title="返回到看板列表页" @click="backTo" class="common-detail-top-title">看板列表&gt;</span>
            <span>&nbsp;看板名称 : {{panelItem.name || '看板详情'}}</span>
          </div>
          <div class="float-right">
            <div class="mr-20">
              <calendar-select @on-date-change="dateChange" placement="bottom-end"></calendar-select>
            </div>
          </div>
        </div>
        <div class="common-detail-top-item clearfix">
          <div class="float-left">
            <Button type="primary" icon="plus" @click="createData">添加图表</Button>
          </div>
          <div class="float-right">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
      </div>
      <div class="table-list">
        <!-- <div class="table-list-header clearfix  mb-10">
        </div> -->
        <div class="box-content">
          <chart-list 
          @on-edit-chart="editData"
          @on-remove-chart="removeData" ref="chartList"></chart-list>
        </div>
      </div>
    </div>
    <!-- 添加chart -->
    <chart-add ref="addChartModal" @on-create-success="createSuccess"></chart-add>
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
import chartAdd from '../../components/board/chart-add';
import chartList from '../../components/dashboard/chart-list';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'panelDetail',
  components: {
    paging,
    chartAdd,
    chartList,
    calendarSelect,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filter: { // 过滤条件
        productId: 0,
        panelId: 0,
        start_time: '',
        end_time: '',
      },
      panelId: 0,
      panelItem: {}, // 看板信息
      removeModal: false, // 删除弹出
      deleteObj: {}, // 删除对象
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/console/panel/list/${this.filter.productId}`,
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 获取数据,用在子页面
    getData(params) {
      this.$refs.chartList.initData(params);
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
      this.panelId = parseInt(this.$route.params.panelId, 10); // 看板id
      const str = localStorage.getItem('panelItem');
      const panelItem = JSON.parse(str);
      this.panelItem = panelItem;
      this.filter.panelId = this.panelId;
      // filter中是productId和panelId
      this.getData(this.filter);
    },
    // 操作--------------------------------------------------------
    // 创建数据
    createData() {
      this.$refs.addChartModal.createData(this.panelId);
    },
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') {
          this.$Message.success('添加成功');
        } else {
          this.$Message.success('编辑成功');
        }
        this.getData(this.filter);
      }
    },
    // 编辑图表信息,打开编辑弹窗
    editData(data) {
      this.$refs.addChartModal.editData(data, this.panelId, this.filter.productId);
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
        panelId: this.panelId,
        chartId: this.deleteObj.id,
      };
      deleteCharts(params).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
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
      this.getData(this.filter);
    },
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
