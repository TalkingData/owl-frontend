<style lang="scss">
@import './group-detail-strategy.scss'

</style>
<template>
  <div class="group-detail-strategy table-list">
    <div class="clearfix mb-10">
      <div class="float-right">
        <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </div>
    <div class="box-content">
      <div class="box-content-title">
        <Row>
          <Col class="title-th" span="6">
            策略名称
            <!-- <sort-page 
              :sort-value="filter.order" 
              sort-name="name"
              @on-sort-change="handleSort"></sort-page> -->
          </Col>
          <Col class="title-th" span="6">作者
            <!-- <sort-page 
              :sort-value="filter.order" 
              sort-name="user_name"
              @on-sort-change="handleSort"></sort-page> -->
          </Col>
          <Col class="title-th" span="6">报警次数
          <!-- <sort-page 
            :sort-value="filter.order" 
            sort-name="alarm_count"
            @on-sort-change="handleSort"></sort-page> -->
          </Col>
          <Col class="title-th" span="6">策略追溯时间(分钟)
          <!-- <sort-page 
            :sort-value="filter.order" 
            sort-name="cycle"
            @on-sort-change="handleSort"></sort-page> -->
          </Col>
        </Row>
      </div>
      <paging ref="ruleList" :total="total" @on-page-info-change="pageInfoChange">
        <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
          <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" :class="[item.enable === 0 ? 'disabled' : '']" @click.native="viewRule(item)">
            <Col class="body-td hidden-td" span="6">
              <span :title="item.name">{{item.name || '--'}}</span>
            </Col>
            <Col class="body-td" span="6">
              {{ item.user_name || '--'}}
            </Col>
            <Col class="body-td" span="6">
              {{ item.alarm_count || '--'}}
            </Col>
            <Col class="body-td" span="6">
              {{ item.cycle || '--'}}
            </Col>
          </Row>
        </div>
        <div slot="listTable" class="box-content-body" v-else>
          <Row style="text-align: center" class="box-content-item">暂无数据</Row>
        </div>
      </paging>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getStrategyInGroup } from '../../models/service';
import paging from '../page/paging';
import simpleTable from '../charts/simple-table';
import sortPage from '../page/sort-page';

export default {
  name: 'groupDetailStrategy',
  components: {
    paging,
    simpleTable,
    sortPage,
  },
  props: {},
  data() {
    return {
      groupItem: {}, // 组信息
      // 过滤器
      filter: {
        productId: '',
        page_size: 10,
        page: 1,
        order: '',
      },
      searchName: '',
      total: 10,
      dataList: [], // 列表
      columns: [{
        title: '名称',
        key: 'name',
      }, {
        title: '策略追溯时间',
        key: 'cycle',
      }, {
        title: '状态',
        key: 'enable',
      }, {
        title: '创建人',
        key: 'user_name',
      }, {
        title: '优先级',
        key: 'priority',
      }],
      selectedData: [], // 选中数据
      removeModal: false,
    };
  },
  methods: {
    // 查看规则
    viewRule(rule) {
      this.$router.push({
        path: `/alarm/vrule/${rule.id}/${this.filter.productId}`,
      });
    },
    userSelect(arr) {
      this.selectedData = arr;
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      // this.filter.page = 1;
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    reload() {
      this.getData(this.filter);
    },
    // 获取数据初始化
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      const groupItem = localStorage.getItem('groupItem');
      this.groupItem = JSON.parse(groupItem);
      this.groupId = parseInt(this.$route.params.groupId, 10);
      this.filter.groupId = this.groupId;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      // 获取组下策略列表
      getStrategyInGroup(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.strategies.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.ruleList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
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
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isCorrelate: true,
        };
      }
      return {
        isRemove: false,
        isCorrelate: false,
      };
    },
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
