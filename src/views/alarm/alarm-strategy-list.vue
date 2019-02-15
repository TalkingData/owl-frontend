<style lang="scss">
@import './alarm-strategy-list.scss';

</style>
<template>
  <div class="main-container alarm-strategy">
    <div class="main-list-content">
      <div class="common-detail-top mb-10">
        <div class="clearfix">
          <div class="float-left">
            <Button @click="enableData(1)" :disabled="!disableObj.isEnable" type="primary">启用</Button>
            <Button @click="enableData(0)" :disabled="!disableObj.isDisable" type="primary">禁用</Button>
            <Button @click="removeData" :disabled="!disableObj.isRemove" type="primary">删除</Button>
            <Button type="primary" icon="plus" @click="createData">创建策略</Button>
          </div>
          <div class="float-right">
            <Checkbox v-model="isMyrule" @on-change="checkMy">我的策略</Checkbox>
            <!-- <Select v-model="filterEnable" style="width: 100px;" placeholder="启用筛选">
              <Option value="all">全部</Option>
              <Option :value="1">启用</Option>
              <Option :value="0">禁用</Option>
            </Select> -->
            <!-- <Select v-model="filterStatus" style="width: 100px;" placeholder="状态筛选">
              <Option value="all">全部</Option>
              <Option :value="1">正常</Option>
              <Option :value="0">异常</Option>
            </Select> -->
            <Input style="width: 200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
      </div>
      <div class="rule-list table-list">
        <div class="box-content">
          <paging ref="ruleList" :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size">
            <Table size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              :row-class-name="rowClassName"
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
    <rule-detail-modal ref="ruleDetailModal"></rule-detail-modal>
  </div>
</template>
<script>
import _ from 'lodash';
import core from '../../mixins/core';
import bus from '../../libs/bus';
import { getStrategies, enableStrategie, deleteStrategie } from '../../models/service';
import paging from '../../components/page/paging';
import ruleDetailModal from '../../components/alarm/rule-detail-modal';

export default {
  name: 'alarmStrategy',
  mixins: [core],
  components: {
    paging,
    ruleDetailModal,
  },
  data() {
    return {
      loading: false,
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filterEnable: '', // 筛选条件
      filterStatus: '', // 状态筛选
      isMyrule: false,
      isRole: false,
      isAddStatus: false, // 是否是添加模式
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
        order: '',
      },
      total: 0,
      selectedData: [], // 选中数据
      deleteIndex: -1,
      deleteObj: null,
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '策略名称',
          key: 'name',
          sortable: 'custom',
          minWidth: 200,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看策略',
            },
            on: {
              click: () => {
                this.viewRule(params.row);
              },
            },
          }, params.row.name),
        }, {
          title: '是否启用',
          width: 140,
          key: 'enable',
          render: (h, params) => h('Tag', {
            props: {
              color: params.row.enable ? 'green' : 'red',
            },
            style: {
              cursor: 'default',
            },
          }, params.row.enable ? '启用' : '禁用'),
        }, {
          title: '状态',
          width: 200,
          render: (h, params) => h('div', {}, [params.row.alert_count !== 0 ? h('Tooltip', {
            props: {
              content: 'alert',
              placement: 'top',
            },
          }, [h('Badge', {
            props: {
              count: params.row.alert_count,
            },
            class: {
              'alert-count': true,
              'mr-10': true,
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.openAlarmList(params.row);
              },
            },
          })]) : '', params.row.unknow_count !== 0 ? h('Tooltip', {
            props: {
              content: 'unknow',
              placement: 'top',
            },
          }, [h('Badge', {
            props: {
              count: params.row.unknow_count,
            },
            class: {
              'unknow-count': true,
              'mr-10': true,
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.showAlarm(params.row, params.row.name, 5);
              },
            },
          })]) : '', params.row.nodata_count !== 0 ? h('Tooltip', {
            props: {
              content: 'nodata',
              placement: 'top',
            },
          }, [h('Badge', {
            props: {
              count: params.row.nodata_count,
            },
            class: {
              'nodata-count': true,
              'mr-10': true,
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.showAlarm(params.row, params.row.name, 4);
              },
            },
          })]) : '', params.row.alert_count === 0 &&
          params.row.unknow_count === 0 &&
          params.row.nodata_count === 0 ? h('Tooltip', {
            props: {
              content: '正常',
              placement: 'top',
            },
          }, [h('Badge', {
            props: {
              count: 'ok',
            },
            class: {
              'ok-count': true,
            },
          })]) : '']),
        }, {
          title: '创建者',
          key: 'user_name',
          minWidth: 160,
        }, {
          title: '操作',
          align: 'right',
          width: 160,
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: '编辑',
              placement: 'top',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'edit',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.editRule(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '克隆',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'ios-copy-outline',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.cloneRule(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: params.row.enable ? '禁用' : '启用',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: params.row.enable ? 'android-volume-off' : 'android-volume-up',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.enableTrigger(params.row, params.index);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '删除',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'trash-a',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.deleteRule(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isEnable: true,
          isDisable: true,
        };
      }
      return {
        isRemove: false,
        isEnable: false,
        isDisable: false,
      };
    },
  },
  methods: {
    // 打开告警列表页
    openAlarmList(strategy) {
      this.$router.push({
        path: `/alarm/event/listby/${strategy.id}/1/${this.filter.productId}`,
      });
    },
    // 新建策略
    createData() {
      this.$router.push({
        path: `/alarm/brule/${this.filter.productId}`,
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName.trim();
      this.initFilter();
    }, 300), // 搜索
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    rowClassName() {
      return 'show-ivu-row';
      // return item.enable === 0 ? 'show-ivu-row disabled' : 'show-ivu-row';
    },
    // 翻页
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
    checkMy(value) {
      if (value) {
        this.filter.my = true;
        this.initFilter();
      } else {
        delete this.filter.my;
        this.initFilter();
      }
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.ruleList.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.loading = true;
      const param = Object.assign({}, params);
      if (param.query === '') delete param.query;
      if (param.order === '') delete param.order;
      getStrategies(param).then((res) => {
        this.selectedData = [];
        if (res.status === 200) {
          this.total = res.data.total;
          if (res.data.strategies) {
            this.dataList = res.data.strategies;
          }
        } else {
          this.total = 0;
          this.dataList = [];
        }
        this.loading = false;
      });
    },
    // 禁用 or 启用
    enableStrategie(params) {
      enableStrategie(params).then((res) => {
        if (res.status === 200) {
          this.getData(this.filter);
        }
      });
    },
    // 删除
    deleteStrategie(params) {
      deleteStrategie(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success('已成功删除');
          this.getData(this.filter);
        }
      });
    },
    // 策略操作----------------------------------------------------
    // 开启禁用
    enableTrigger(obj) {
      const enable = (obj.enable + 1) % 2;
      const params = {
        productId: this.filter.productId,
        param: `?strategy_id=${obj.id}&enable=${enable}`,
      };
      this.enableStrategie(params);
    },
    // 批量启用,禁用
    enableData(enable) {
      if (this.selectedData.length) {
        let ids = '?';
        this.selectedData.forEach((item, index) => {
          if (index === 0) {
            ids += `strategy_id=${item.id}`;
          } else {
            ids += `&strategy_id=${item.id}`;
          }
        });
        const params = {
          productId: this.filter.productId,
          param: `${ids}&enable=${enable}`,
        };
        this.enableStrategie(params);
      }
    },
    // 批量删除
    removeData() {
      if (this.selectedData.length) {
        let ids = '?';
        let names = '';
        this.selectedData.forEach((item, index) => {
          if (index === 0) {
            ids += `strategy_id=${item.id}`;
            names += item.name;
          } else {
            ids += `&strategy_id=${item.id}`;
            names += `, ${item.name}`;
          }
        });
        const params = {
          param: ids,
          productId: this.filter.productId,
        };
        this.$Modal.confirm({
          title: '删除策略',
          content: `确定要删除策略：<span style="color: #2d8cf0;">${names}</span> 吗？`,
          onOk: () => {
            this.deleteStrategie(params);
          },
        });
      }
    },
    // 删除策略
    deleteRule(rule) {
      this.deleteObj = rule;
      const params = {
        productId: this.filter.productId,
        param: `?strategy_id=${rule.id}`,
      };
      this.$Modal.confirm({
        title: '删除策略',
        content: `确定要删除策略：<span style="color: #2d8cf0;">${rule.name}</span> 吗？`,
        onOk: () => {
          this.deleteStrategie(params);
        },
      });
    },
    // 查看告警状态详情
    showAlarm(alarm, name, status) {
      this.$refs.ruleDetailModal.showAlarm(alarm, name, status);
    },
    // 查看策略
    viewRule(rule) {
      this.$router.push({
        path: `/alarm/vrule/${rule.id}/${this.filter.productId}`,
      });
    },
    // 编辑策略
    editRule(rule) {
      localStorage.setItem('eruleInfo', JSON.stringify(rule));
      this.$router.push({
        path: `/alarm/erule/${rule.id}/${this.filter.productId}`,
      });
    },
    // 克隆策略
    cloneRule(rule) {
      this.$router.push({
        path: `/alarm/crule/${rule.id}/${this.filter.productId}`,
      });
    },
    // 返回该页时情况
    backToSuccess() {
      if (bus.backtoRulelist) {
        const str = bus.backtoRulelist;
        this.$Message.success({
          content: str,
          duration: 3,
        });
        bus.backtoRulelist = '';
      }
    },
  },
  created() {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
    this.backToSuccess();
  },
};

</script>
