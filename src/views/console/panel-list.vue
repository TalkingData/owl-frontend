<style lang="scss">
  @import './panel-list.scss'
</style>
<template>
  <div class="main-container">
    <div class="monitor-container">
      <div class="table-list panel-list">
        <div class="table-list-header clearfix mb-10">
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
        <div class="box-content">
          <div class="box-content-title">
            <Row>
              <Col class="title-th" span="8">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>
              看板名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="8">创建人
              <sort-page 
                :sort-value="filter.order" 
                sort-name="creator"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="8"></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="8">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td" span="8">{{item.creator || '--'}}</Col>
                <Col class="body-td" span="8">
                <div class="float-right pr-20">
                  <Tooltip content="编辑" placement="top">
                    <Icon size="18" type="edit" @click.native.stop="editData(item)"></Icon>
                  </Tooltip>
                  <Tooltip content="删除" placement="top" class="ml-10">
                    <Icon size="18" type="trash-a" @click.native.stop="removeData(item)"></Icon>
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
import sortPage from '../../components/page/sort-page';

export default {
  name: 'panelList',
  components: {
    paging,
    sortPage,
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
      checkAll: false, // 全选
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
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取表格内容数据
    getData(params) {
      this.selectedData = [];
      this.checkAll = false;
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getPanels(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.panels.map((item) => {
            const host = item;
            host.checked = false;
            return host;
          });
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
      this.filter.order = value;
      this.initFilter();
    },
    // 单选
    selectItem(item, index) {
      this.dataList[index].checked = !this.dataList[index].checked;
      this.selectedData = this.dataList.filter(plugin => plugin.checked);
      this.checkAll = this.selectedData.length === this.dataList.length;
    },
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
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.query = this.searchName;
      this.initFilter();
      // this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      // this.filter.query = '';
      // this.filter.page = 1;
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
