<style lang="scss">
  @import './panel-list.scss'
</style>
<template>
  <div class="main-container panel-list">
    <div class="main-list-content">
      <div class="common-detail-top clearfix">
        <div class="float-left">
          <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除看板</Button>
          <Button type="primary" icon="plus" @click="createData">创建看板</Button>
        </div>
        <div class="float-right">
          <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          <Button @click="reload">
            <Icon size="18" type="refresh"></Icon>
          </Button>
        </div>
      </div>
      <div class="table-list">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <Table slot="listTable" size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              no-data-text="暂无数据"
              @on-select-all="selectAll"
              @on-selection-change="selectItem"
              @on-sort-change="handleSort"
              ></Table>
          </paging>
        </div>
      </div>
    </div>
    <Modal :title="createTitle" v-model="createModal">
      <Form :model="createInfo" ref="createInfo" :label-width="80">
        <Form-item label="看板名称" prop="name" :rules="{ required: true, type: 'string', trigger: 'change', message: '请输入看板名称' }">
          <Input v-model="createInfo.name"></Input>
        </Form-item>
      </Form>
       <div slot="footer">
        <Button @click="createSuccess" type="primary">确定</Button>
        <Button @click="createCancel">取消</Button>
      </div>
    </Modal>
    <Modal title="删除看板" v-model="removeModal">
      <Alert type="warning" show-icon>确定要删除看板：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import axios from 'axios';
// import bus from '../../libs/bus';
import { getPanels, addPanels, updatePanels, deletePanels } from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'panelList',
  components: {
    paging,
  },
  data() {
    return {
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
        productId: '',
        order: '',
      },
      total: 0, // 总数
      selectedData: [], // 选中数据
      statusList: [], // 筛选
      dataStatus: '',
      searchName: '', // 搜索名称
      deleteShowData: [],
      removeModal: false,
      // 创建看板
      createModal: false,
      createTitle: '创建看板',
      createInfo: {
        name: '',
      },
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '看板名称',
          key: 'name',
          sortable: 'custom',
          render: (h, params) => h('a', {
            attrs: {
              title: '查看看板',
              // eslint-disable-next-line
              href: 'javascript:;',
            },
            on: {
              click: () => {
                this.viewDetail(params.row);
              },
            },
          }, params.row.name),
        }, {
          title: '创建人',
          key: 'creator',
          sortable: 'custom',
        }, {
          title: '操作',
          align: 'right',
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
                this.editData(params.row);
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
                this.removeData(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  methods: {
    // 创建看板
    createData() {
      this.createInfo.name = '';
      this.createInfo.id = '';
      this.createTitle = '创建看板';
      this.createModal = true;
    },
    // 创建成功回调
    createSuccess() {
      this.$refs.createInfo.validate((valid) => {
        if (valid) {
          if (this.createTitle === '创建看板') {
            this.addPanels();
          } else if (this.createTitle === '编辑看板') {
            this.updatePanels();
          }
        }
      });
    },
    createCancel() {
      this.createInfo.name = '';
      this.createInfo.id = '';
      this.createTitle = '创建看板';
      this.createModal = false;
    },
    // 编辑看板
    editData(obj) {
      this.createInfo.name = obj.name;
      this.createInfo.id = obj.id;
      this.createTitle = '编辑看板';
      this.createModal = true;
    },
    // 创建看板接口
    addPanels() {
      addPanels({
        productId: this.filter.productId,
        name: this.createInfo.name,
      }).then((res) => {
        if (res.status === 200) {
          this.$Message.success('创建成功');
          this.getData(this.filter);
        } else {
          this.$Message.warning('创建失败');
        }
        this.createModal = false;
      });
    },
    // 编辑看板接口
    updatePanels() {
      updatePanels({
        productId: this.filter.productId,
        name: this.createInfo.name,
        id: this.createInfo.id,
      }).then((res) => {
        if (res.status === 200) {
          this.$Message.success('编辑成功');
          this.getData(this.filter);
        } else {
          this.$Message.warning('编辑失败');
        }
        this.createModal = false;
      });
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除看板
    removeData(obj) {
      if (obj === 'multiple') { // 删除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 删除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 删除看板确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deletePanels();
      }
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 删除成功
    deletePanels() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deletePanels({
            panelId: item.id,
            productId: this.filter.productId,
          }));
        });
        axios.all(api).then((res) => {
          if (res) {
            this.selectedData = [];
            this.deleteShowData = [];
            this.initFilter();
            this.removeModal = false;
            this.$Message.success('删除成功');
          }
        });
      }
    },
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('panelItem', JSON.stringify(item));
      this.$router.push({
        path: `/console/panel/detail/${item.id}/${this.filter.productId}`,
      });
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 获取表格内容数据
    getData(params) {
      this.selectedData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getPanels(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.panels;
        } else {
          this.total = 0;
          this.dataList = [];
        }
      });
    },
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      // this.filter.order = value;
      this.initFilter();
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
    // 全选
    selectAll(arr) {
      this.selectedData = arr;
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
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
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
        };
      }
      return {
        isRemove: false,
      };
    },
  },
};

</script>
