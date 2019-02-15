<style lang="scss">
@import './host-detail.scss';
</style>
<template>
  <div class="main-container host-detail">
    <div class="main-list-content">
      <div class="common-detail-top common-detail-top-fixed">
        <Row class="common-detail-top-item" id="headerTopOne">
          <Col span="12" style="overflow: hidden;">
            <div class="float-left">
              <span title="返回到上级页面" @click="backTo" class="common-detail-top-title">返回上级&gt;</span>
              <span>&nbsp;主机名称 : {{hostItemInfo.hostname || '主机详情'}}</span>
            </div>
          </Col>
          <Col span="12" style="overflow: hidden;">
            <div class="float-right">
              <Tag @click.native="triggerApp('default')" 
              :color="getColor('default')">default</Tag>
              <Tag @click.native="triggerApp(item)" v-for="(item, index) in appList" 
              :key="index" :color="getColor(item)">{{item}}</Tag>
            </div>
          </Col>
        </Row>
        <Row class="common-detail-top-item">
          <div class="float-left">
            <Button type="primary" @click="showChart" :disabled="!disableObj.isRemove">
              查看多图
            </Button>
            <Button type="primary" @click="showSingleChart" :disabled="!disableObj.isRemove">
              查看单图
            </Button>
            <!-- <Button icon="minus" @click="removeData()" :disabled="!disableObj.isRemove" type="primary">删除Metric</Button> -->
          </div>
          <div class="float-right">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </Row>
      </div>
      <div class="table-list" :style="styleTop">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page" :pageSize="filter.page_size">
            <Table size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              :loading="loading"
              no-data-text="暂无数据"
              @on-select-all="selectAll"
              @on-selection-change="selectItem"
              @on-sort-change="handleSort"
              ></Table>
          </paging>
        </div>
      </div>
    </div>
    <Modal :styles="modalStyle" width="100" v-model="chartModal" :scrollable="false" title="查看多图" :mask-closable="false" @on-cancel="cancel">
      <div :style="innerStyle">
        <line-chart-list ref="chartList"></line-chart-list>
      </div>
      <div slot="footer">
      </div>
    </Modal>
    <Modal :styles="modalStyle" width="100" v-model="singleModal" :scrollable="false" title="查看单图" :mask-closable="false" @on-cancel="cancelSingle">
      <div :style="innerStyle">
        <line-chart-single ref="chartSingle"></line-chart-single>
      </div>
      <div slot="footer">
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import axios from 'axios';
import core from '../../mixins/core';
// import bus from '../../libs/bus';
import { getHostDetail, getMetricByHost, deleteHostMetric, getAppByHost } from '../../models/service';
import paging from '../../components/page/paging';
import lineChartList from '../../components/monitor/line-chart-list';
import lineChartSingle from '../../components/monitor/line-chart-single';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'hostMetric',
  mixins: [core],
  components: {
    paging,
    lineChartList,
    lineChartSingle,
    calendarSelect,
  },
  props: {},
  data() {
    return {
      height: 100,
      loading: false,
      chartModal: false,
      singleModal: false,
      modalStyle: {
        top: 0,
        height: '100%',
        overflow: 'hidden',
      },
      innerStyle: {
        height: '100%',
        overflow: 'scroll',
      },
      dataList: [], // 数据列表,metric
      searchName: '', //  搜索名称
      selectedData: [],
      showData: [],
      filter: { // 过滤条件
        page: 1,
        page_size: 10,
        productId: 0,
        hostId: 0,
        chartCount: 'multiple', // multiple,多图显示;single,单图显示
        prefix: 'default',
        load: 'refresh', // 是否初始化page
      },
      total: 0,
      hostId: 0,
      hostItemInfo: {}, // 主机信息
      appList: [], // 主机分类列表
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: 'metric',
          key: 'metric',
          // sortable: 'custom',
          minWidth: 140,
        }, {
          title: '标签',
          key: 'tags',
          // sortable: 'custom',
          minWidth: 200,
        }, {
          title: '数据类型',
          key: 'data_type',
          width: 140,
        }, {
          title: '更新时间',
          key: 'update_at',
          width: 150,
        }, {
          title: '采集周期(秒)',
          key: 'cycle',
          width: 180,
        },
        // {
        //   title: '操作',
        //   key: 'operate_column',
        //   width: 100,
        //   render: (h, params) => h('div', {}, [h('Tooltip', {
        //     props: {
        //       content: '删除',
        //       placement: 'top',
        //     },
        //   }, [h('Icon', {
        //     props: {
        //       size: 18,
        //       type: 'ios-trash',
        //     },
        //     style: {
        //       cursor: 'pointer',
        //     },
        //     nativeOn: {
        //       click: (event) => {
        //         event.stopPropagation();
        //         this.removeData(params.row);
        //       },
        //     },
        //   })])]),
        // },
      ],
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
      this.filter.load = 'init'; // 应该不需要了
      this.filter.page = 1;
      this.$refs.page.init();
      this.getData(this.filter);
    }, 1000),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 查看图表
    showChart() {
      if (document.body.clientHeight) {
        this.modalStyle['max-height'] = `${document.body.clientHeight}px`;
        this.innerStyle.height = `${document.body.clientHeight - 100}px`;
      }
      this.chartModal = true;
      // 初始化图表，将过滤器,主机信息,metric列表传入
      this.$refs.chartList.initData(this.filter, this.hostItemInfo, this.selectedData);
    },
    // 查看图表
    showSingleChart() {
      if (document.body.clientHeight) {
        this.modalStyle['max-height'] = `${document.body.clientHeight}px`;
        this.innerStyle.height = `${document.body.clientHeight - 100}px`;
      }
      this.singleModal = true;
      // 初始化图表，将过滤器,主机信息,metric列表传入
      this.$refs.chartSingle.initData(this.filter, this.hostItemInfo, this.selectedData);
    },
    removeData(obj) {
      if (obj) {
        this.showData = [obj];
      } else {
        this.showData = this.selectedData;
      }
      if (this.showData.length > 0) {
        let names = '';
        this.showData.forEach((item, index) => {
          if (index === 0) {
            names += `metric: ${item.metric} tag: ${item.tags || '无'}`;
          } else {
            names += `, metric: ${item.metric} tag: ${item.tags || '无'}`;
          }
        });
        this.$Modal.confirm({
          title: '删除Metric',
          width: 600,
          content: `确定要删除Metric：<span style="color: #2d8cf0;">${names}</span> 吗？`,
          onOk: () => {
            this.deleteConfirm();
          },
        });
      }
    },
    // 确认删除
    deleteConfirm() {
      if (this.showData.length) {
        const attApi = this.showData.map(item => deleteHostMetric({
          hostId: this.hostId,
          metricId: item.id,
        }));
        axios.all(attApi).then((all) => {
          if (all.length === this.showData.length) {
            let success = true;
            let errormsg = '';
            all.forEach((res) => {
              if (!(res.status === 204)) {
                success = false;
                errormsg += res.data.message;
              }
            });
            if (success) {
              this.$Message.success('删除成功');
              this.reload();
            } else {
              this.$Message.warning({
                content: `删除失败: ${errormsg}`,
                duration: 3,
              });
            }
          }
        }).catch((error) => {
          if (error) {
            this.$Message.warning({
              content: error,
              duration: 3,
            });
          }
        });
      }
    },
    // 获取数据,用在子页面
    getData(params) {
      this.loading = true;
      const param = {
        hostId: params.hostId, // 主机id
        query: params.query,
        page: this.filter.page,
        page_size: this.filter.page_size,
        order: this.filter.order,
        prefix: params.prefix,
      };
      if (!param.query) delete param.query;
      if (!param.prefix || param.prefix === 'default') delete param.prefix;
      if (!param.order) delete param.order;
      getMetricByHost(param).then((res) => {
        this.selectedData = [];
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.metrics;
        } else {
          this.total = 0;
          this.dataList = [];
        }
        this.loading = false;
      });
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    pageInfoChange(filter) {
      // this.setInitPage(filter.pageSize);
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 初始化获取数据
    getDetailData() {
      // 获取产品id
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      this.hostId = this.$route.params.hostId; // 主机id
      this.filter.hostId = this.hostId;
      const hostAppname = localStorage.getItem('hostAppname');
      if (hostAppname) {
        this.filter.prefix = hostAppname;
      } else {
        this.filter.prefix = 'default';
      }
      this.filter.load = 'init';
      this.getHostDetail(this.filter.hostId);
      this.getAppByHost(this.filter.hostId); // 先获取app，再获取主机
    },
    // 获取主机详情
    getHostDetail(id) {
      getHostDetail({
        hostId: id,
      }).then((res) => {
        if (res.status === 200) {
          this.hostItemInfo = res.data.host;
        }
      });
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
    getColor(item) {
      if (item === this.filter.prefix) return 'blue';
      return 'default';
    },
    // 取消查看图表
    cancel() {
      this.$refs.chartList.close();
      this.chartModal = false;
    },
    cancelSingle() {
      this.$refs.chartSingle.close();
      this.singleModal = false;
    },
    getAppByHost(id) {
      getAppByHost({
        hostId: id,
      }).then((res) => {
        if (res.status === 200) {
          this.appList = res.data.apps;
          if (this.appList.indexOf(this.filter.prefix) === -1) {
            this.filter.prefix = 'default';
          }
          // filter中是productId和hostId
          this.getData(this.filter);
        }
        this.$nextTick(() => {
          this.getPageHight();
        });
      });
    },
    getPageHight() {
      const ele = document.getElementById('headerTopOne');
      const divHeight = ele.offsetHeight + 53;
      this.height = divHeight > 100 ? divHeight : 100;
    },
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length > 0) {
        return {
          isRemove: true,
        };
      }
      return {
        isRemove: false,
      };
    },
    styleTop() {
      return `margin-top: ${this.height}px;`;
    },
  },
  created() {
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
    window.onresize = (() => {
      this.getPageHight();
    });
    // bus.$on('on-shrink-change', () => {
    //   this.$refs.chartList.refreshData();
    // });
  },
  beforeDestroy() {
    window.onresize = null;
    // bus.$off('on-shrink-change');
  },
};

</script>
