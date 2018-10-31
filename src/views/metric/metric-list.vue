<style lang="scss">
  @import './metric-list.scss'
</style>
<template>
  <div class="main-container metric-list">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
        <div class="float-right">
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
        </div>
      </div>
      <div class="table-list">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <Table slot="listTable" size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              :row-class-name="rowClassName"
              no-data-text="暂无数据"
              @on-row-click="viewDetail"
              ></Table>
          </paging>
        </div>
      </div>
    </div>
    <div class="screen-show-data" v-if="showTagModal">
      <Card style="width:650px; background:#eee;">
        <p slot="title">
          <Icon type="podium"></Icon>
          {{selectedData.name}}
        </p>
        <a href="javascript:;" slot="extra" @click.prevent="viewCancel">
          <Icon type="close"></Icon>
        </a>
        <Card :bordered="false">
          <p slot="title">tags</p>
          <div class="tag-area" v-if="tagSet">
            <Row class="tag-item" v-for="(value, key) in tagSet" :key="key">
              <h4 class="key-title-sub">KEY: {{key}}</h4>
              <ul v-if="value.length">
                <li v-for="(item, index) in value" :key="item + index">{{item}}</li>
              </ul>
            </Row>
          </div>
        </Card>
      </Card>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import {
  getSuggestMetric,
  getSuggestTags,
} from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'monitorHost',
  components: {
    paging,
  },
  props: {
  },
  data() {
    return {
      saveDataList: [], // 作为备份的数据列表
      allDataList: [], // 所有数据列表
      dataList: [], // 表格数据,指标列表
      filter: {
        page_size: 10,
        page: 1,
        productId: '',
      },
      total: 0, // 总数
      selectedData: null, // 选中数据
      searchName: '', // 搜索名称
      showTagModal: false,
      tagSet: null, // 根据你metric获取的tags信息
      keydataList: [],
      valuedataList: [],
      columns: [
        {
          title: '指标名称',
          key: 'name',
          minWidth: 200,
        },
      ],
    };
  },
  computed: {
    tableHeight() {
      if (this.dataList.length) {
        if (this.dataList.length > 10) {
          return 520;
        }
        return 40 + (this.dataList.length * 48);
      }
      return 88;
    },
  },
  methods: {
    // 查看指标确认
    viewConfirm() {
      this.showTagModal = false;
    },
    // 取消查看
    viewCancel() {
      this.showTagModal = false;
      this.selectedData = {};
      this.dataList = this.dataList.map((host) => {
        const obj = host;
        obj.checked = false;
        return obj;
      });
    },
    // 查看详情
    viewDetail(item, index) {
      this.selectedData = item;
      this.dataList = this.dataList.map((host, i) => {
        const obj = host;
        if (index === i) {
          obj.checked = !obj.checked;
        } else {
          obj.checked = false;
        }
        return obj;
      });
      if (this.dataList[index].checked) {
        this.getSuggestTags({
          product_id: this.filter.productId,
          metric: item.name,
        });
        this.showTagModal = true;
      } else {
        this.viewCancel();
      }
    },
    // 获取表格内容数据
    getData(params) {
      this.initFilter();
      const param = {
        product_id: params.productId,
      };
      // if (params.query !== '') param.query = params.query;
      getSuggestMetric(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.metrics.length;
          this.saveDataList = res.data.metrics.map((item) => {
            const obj = {
              checked: false,
              name: item,
            };
            return obj;
          });
          this.allDataList = res.data.metrics.map((item) => {
            const obj = {
              checked: false,
              name: item,
            };
            return obj;
          });
          this.dataList = this.allDataList.slice(0, this.filter.page_size);
        } else {
          this.total = 0;
          this.allDataList = [];
          this.saveDataList = [];
          this.dataList = [];
        }
      });
    },
    // 获取tags列表
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200) {
          this.tagSet = res.data.tag_set;
          if (res.data.code === 200) {
            this.keydataList = Object.keys(res.data.tag_set);
          }
        } else {
          this.keydataList = [];
        }
      });
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.allDataList = this.allDataList.map((item) => {
        const obj = item;
        obj.checked = false;
        return obj;
      });
      this.selectedData = {};
      this.showTagModal = false;
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.showTagModal = false;
      this.initFilter();
      const query = this.searchName.trim();
      this.filter.query = query;
      // this.getData(this.filter);
      if (query) {
        this.allDataList = this.saveDataList.filter((item) => {
          const obj = item;
          obj.checked = false;
          return obj.name.indexOf(query) > -1;
        });
      } else {
        this.allDataList = this.saveDataList.map((item) => {
          const obj = Object.assign({}, item);
          obj.checked = false;
          return obj;
        });
      }
      this.total = this.allDataList.length;
      this.dataList = this.allDataList.slice(0, this.filter.page_size);
    }, 300),
    // 滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    rowClassName(item) {
      return item.checked ? 'cursor-ivu-row selected' : 'cursor-ivu-row';
    },
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
  },
};

</script>
