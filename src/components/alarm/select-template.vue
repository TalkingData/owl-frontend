<style>
.select-template-content .ivu-table-row {
  cursor: pointer;
}
</style>
<template>
  <div>
    <Modal width="80" v-model="showModal" :title="modalTitle" class="select-template">
      <div class="select-template-content">
        <div class="clearfix mb-10">
          <div class="float-left">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          </div>
        </div>
        <!-- @on-row-click="dataSelect" -->
        <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size">
          <Table size="small" 
          :columns="userColumn" 
          :data="dataList"
          :loading="loading"
          @on-row-click="dataSelect"></Table>
        </paging>
      </div>
      <div slot="footer">
        <!-- <Button @click="cancel">取消</Button>
        <Button type="primary" @click="confirmSave">确定</Button> -->
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import core from '../../mixins/core';
// import bus from '../../libs/bus';
import {
  getTemplateInfo,
  getTemplates,
} from '../../models/service';
import paging from '../page/paging';

export default {
  name: 'selectTemplate',
  mixins: [core],
  props: {},
  components: {
    paging,
  },
  data() {
    return {
      loading: false,
      total: 0,
      filter: { // 翻页
        page: 1,
        page_size: 10,
      },
      searchName: '',
      // 模板列表列
      userColumn: [{
        title: '名称',
        key: 'name',
        width: 300,
      }, {
        title: '描述',
        key: 'description',
        minWidth: 200,
      }],
      // {
      //   title: '操作',
      //   key: 'id',
      //   width: 100,
      //   render: (h, params) => h('Button', {
      //     props: {
      //       type: 'primary',
      //       size: 'small',
      //     },
      //     style: {
      //       marginRight: '5px',
      //     },
      //     on: {
      //       click: () => {
      //         this.dataSelect(params.row);
      //       },
      //     },
      //   }, '选择'),
      // }
      showModal: false,
      allDataList: [],
      dataList: [], // 主机列表
      selectData: null, // 已选主机
      msgInfo: '', // 操作方式
      modalTitle: '', // 弹出框抬头
      errorMsg: '', // 错误提示信息
    };
  },
  computed: {
  },
  beforeDestory() {},
  methods: {
    // 选择主机
    dataSelect(arr) {
      this.selectData = arr;
      this.getTemplateInfo({
        templateId: arr.id,
      });
    },
    // 翻页
    pageInfoChange(filter) {
      // this.setInitPage(filter.pageSize);
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      // this.initFilter();
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
    },
    initFilter() {
      this.filter.page = 1;
      this.getTemplates(this.filter);
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    // 编辑组
    editInit(msg) {
      this.modalTitle = '选择模板';
      this.msgInfo = msg;
      this.errorMsg = '';
      this.filter.query = '';
      this.searchName = '';
      this.showModal = true;
      this.initFilter();
    },
    // 获取主机组外主机列表
    getTemplates(params) {
      this.loading = true;
      this.selectData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      getTemplates(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.templates.length;
          this.allDataList = res.data.templates;
          this.dataList = this.allDataList.slice(0, this.filter.page_size);
        } else {
          this.total = 0;
          this.allDataList = [];
          this.dataList = [];
        }
        this.loading = false;
      });
    },
    // 取消弹窗
    cancel() {
      this.errorMsg = '';
      this.showModal = false;
      this.dataList = [];
      this.selectData = [];
    },
    // 弹窗确认
    confirmSave() {
    },
    // 获取模板信息以后,进行模板复制
    getTemplateInfo(params) {
      getTemplateInfo(params).then((res) => {
        if (res.status === 200) {
          this.$emit('on-create-success', this.msgInfo, res.data);
          this.errorMsg = '';
          this.filter.query = '';
          this.searchName = '';
          this.showModal = false;
        }
      });
    },
  },
  created() {
  },
  mounted() {},
};

</script>
