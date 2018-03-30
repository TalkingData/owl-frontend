<style lang="scss">
@import './alarm-strategy-list.scss'

</style>
<template>
  <div class="main-container alarm-strategy">
    <div class="alarm-content">
      <div class="rule-list table-list">
        <div class="table-list-header">
          <div class="clearfix mb-10">
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
        <div class="box-content">
          <div class="box-content-title">
            <Row>
              <Col class="title-th" span="6">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>策略名称
                <sort-page 
                :sort-value="filter.order" 
                sort-name="name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="6">status</Col>
              <Col class="title-th" span="6">
                创建者
              </Col>
              <Col class="title-th pr-20" span="6" style="text-align:right;">
                操作
              </Col>
            </Row>
          </div>
          <paging ref="ruleList" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" :class="[item.enable === 0 ? 'disabled' : '']" @click.native="viewRule(item)">
                <Col class="body-td" span="6">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td" span="6">
                <!-- 策略目前触发的活跃报警个数 -->
                  <Tooltip content="alert" placement="top"v-if="item.alert_count != 0">
                    <Badge :count="item.alert_count" class="alert-count mr-10"  @click.native.stop="openAlarmList(item)"></Badge>
                  </Tooltip>
                  <!-- 策略目前采集出问题的个数  5-->
                  <Tooltip content="unknow" placement="top" v-if="item.unknow_count != 0" >
                    <Badge
                      :count="item.unknow_count" 
                      class="unknow-count mr-10"
                      @click.native.stop="showAlarm(item, item.name, 5)">
                      </Badge>
                  </Tooltip>
                  <!-- 策略目前采集到空数据的个数  4-->
                  <Tooltip content="nodata" placement="top" v-if="item.nodata_count != 0">
                    <Badge
                    :count="item.nodata_count" 
                    class="nodata-count mr-10"
                    @click.native.stop="showAlarm(item, item.name, 4)">
                    </Badge>
                  </Tooltip>
                  <Tooltip content="正常" placement="top" v-if="item.alert_count === 0 && item.unknow_count === 0 && item.nodata_count === 0">
                    <Badge  count="ok" class="ok-count"></Badge>
                  </Tooltip>
                </Col>
                <Col class="body-td" span="6">
                  <span :title="item.user_name">{{ item.user_name || '--'}}</span>
                </Col>
                <Col class="body-td" span="6">
                <!-- operate-item -->
                  <div class="float-right pr-20">
                    <Tooltip content="编辑" placement="top" class="ml-10">
                      <Icon size="18" type="edit" @click.native.stop="editRule(item)"></Icon>
                    </Tooltip>
                    <Tooltip content="克隆" placement="top" class="ml-10">
                      <Icon size="18" type="ios-copy-outline" @click.native.stop="cloneRule(item)"></Icon>
                    </Tooltip>
                    <Tooltip :content="item.enable ? '禁用' : '启用'" placement="top" class="ml-10">
                      <Icon size="18" :type="item.enable === 1 ? 'android-volume-off' : 'android-volume-up'" @click.native.stop="enableTrigger(item, index)"></Icon>
                    </Tooltip>
                    <Tooltip content="删除" placement="top" class="ml-10">
                      <Icon size="18" type="trash-a" @click.native.stop="deleteRule(item, index)"></Icon>
                    </Tooltip>
                  </div>
                </Col>
              </Row>
            </div>
            <div slot="listTable" class="box-content-body" v-else>
              <Row style="text-align: center" class="box-content-item">暂无数据</Row>
            </div>
          </paging>
        </div>
      </div>
    </div>
    <rule-detail-modal ref="ruleDetailModal"></rule-detail-modal>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { getStrategies, enableStrategie, deleteStrategie } from '../../models/service';
import paging from '../../components/page/paging';
import ruleDetailModal from '../../components/alarm/rule-detail-modal';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'alarmStrategy',
  components: {
    paging,
    ruleDetailModal,
    sortPage,
  },
  data() {
    return {
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
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      deleteIndex: -1,
      deleteObj: null,
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
        path: `/alarm/eventlistby/${strategy.id}/1/${this.filter.productId}`,
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
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300), // 搜索
    // 全选
    selectAll(flag) {
      if (flag) {
        this.selectedData = this.dataList.map((item) => {
          const obj = item;
          obj.checked = true;
          return obj;
        });
      } else {
        this.selectedData = [];
        this.dataList.map((item) => {
          const obj = item;
          obj.checked = false;
          return obj;
        });
      }
    },
    // 单选
    selectItem(item, index) {
      this.dataList[index].checked = !this.dataList[index].checked;
      this.selectedData = this.dataList.filter(plugin => plugin.checked);
      this.checkAll = this.selectedData.length === this.dataList.length;
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      this.filter.order = value;
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
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      const param = Object.assign({}, params);
      if (param.query === '') delete param.query;
      if (param.order === '') delete param.order;
      getStrategies(param).then((res) => {
        this.checkAll = false;
        if (res.status === 200) {
          this.total = res.data.total;
          if (res.data.strategies) {
            this.dataList = res.data.strategies.map((item) => {
              const obj = item;
              obj.checked = false;
              return obj;
            });
          }
        } else {
          this.total = 0;
          this.dataList = [];
        }
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
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
    this.backToSuccess();
  },
};

</script>
