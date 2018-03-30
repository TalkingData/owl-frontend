<style lang="scss">
  @import './admin-product.scss'
</style>
<template>
  <div class="main-container">
    <div class="monitor-container">
      <div class="table-list product-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除产品线</Button>
            <Button type="primary" icon="plus" @click="addData">创建产品线</Button>
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
              <Col class="title-th" span="5">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>
              产品线名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="5">描述</Col>
              <Col class="title-th" span="5">创建人
              <sort-page 
                :sort-value="filter.order" 
                sort-name="creator"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="3">主机数</Col>
              <Col class="title-th" span="3">用户数</Col>
              <Col class="title-th" span="3"></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="5">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="5" hidden-td>
                  <span :title="item.description">{{item.description || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="5" hidden-td>
                  <span :title="item.creator">{{item.creator || '--'}}</span>
                </Col>
                <Col class="body-td" span="3">{{item.host_cnt || '0'}}</Col>
                <Col class="body-td" span="3">{{item.user_cnt || '0'}}</Col>
                <Col class="body-td" span="3">
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
    <Modal v-model="addModal" :title="proTitle">
      <Form :model="addProInfo" ref="addProInfo">
        <Form-item :label-width="80" label="名称" prop="name" :rules="{ required: true, type: 'string', trigger: 'change', message: '请输入产品线名称'}">
          <Input v-model="addProInfo.name" placeholder="请输入产品线名称"></Input>
        </Form-item>
        <Form-item :label-width="80" label="描述" prop="description" :rules="{ required: true, type: 'string', trigger: 'change', message: '产品线描述不能为空'}">
          <Input v-model="addProInfo.description" placeholder="请输入产品线描述"></Input>
        </Form-item>
        <Alert type="warning" show-icon v-if="errorMsg">{{errorMsg}}</Alert>
      </Form>
      <div slot="footer">
        <Button @click="cancel">取消</Button>
        <Button @click="confirm" type="primary">保存</Button>
      </div>
    </Modal>
    <Modal title="删除产品线" v-model="removeModal">
      <Alert type="warning" show-icon>确定要删除产品线：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
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
import { deleteProduct, addProduct, getAllProducts, updatetProduct } from '../../models/service';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'monitorGroup',
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
      },
      total: 0, // 总数
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      searchName: '', // 搜索名称
      deleteShowData: [],
      removeModal: false,
      addModal: false,
      // 添加产品线信息
      addProInfo: {
        name: '',
        description: '',
        productId: '',
      },
      errorMsg: '', // 错误信息
      isEdit: false, // 是否是编辑
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
    proTitle() {
      if (this.isEdit) return '编辑产品线';
      return '创建产品线';
    },
  },
  methods: {
    addData() {
      this.isEdit = false;
      this.errorMsg = '';
      this.addModal = true;
      this.addProInfo.name = '';
      this.addProInfo.description = '';
    },
    // 编辑产品线
    editData(obj) {
      this.isEdit = true;
      this.errorMsg = '';
      this.addModal = true;
      this.addProInfo.name = obj.name;
      this.addProInfo.description = obj.description;
      this.addProInfo.productId = obj.id;
    },
    confirm() {
      if (this.isEdit) {
        this.updatetProduct();
      } else {
        this.addProduct();
      }
    },
    // 添加产品线
    addProduct() {
      this.errorMsg = '';
      this.$refs.addProInfo.validate((valid) => {
        if (valid) {
          addProduct({
            name: this.addProInfo.name,
            description: this.addProInfo.description,
          }).then((res) => {
            if (res.status === 200) {
              if (res.data.code === 200) {
                this.$Message.success('创建成功');
                this.viewDetail(res.data.product);
                this.addModal = false;
                this.getData(this.filter);
              } else {
                this.errorMsg = res.data.message || '该名称已存在';
              }
            } else {
              this.errorMsg = res.data;
            }
          });
        }
      });
    },
    // 编辑产品线
    updatetProduct() {
      this.$refs.addProInfo.validate((valid) => {
        if (valid) {
          updatetProduct({
            id: this.addProInfo.productId,
            name: this.addProInfo.name,
            description: this.addProInfo.description,
          }).then((res) => {
            if (res.status === 200) {
              if (res.data.code === 200) {
                this.$Message.success('修改成功');
                // this.viewDetail(res.data.product);
                this.addModal = false;
                this.getData(this.filter);
              } else {
                this.errorMsg = res.data.message || '该名称已存在';
              }
            } else {
              this.errorMsg = res.data;
            }
          });
        }
      });
    },
    cancel() {
      this.addModal = false;
      this.addProInfo.name = '';
      this.addProInfo.description = '';
    },
    // 滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除产品线
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
    // 删除产品线确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deleteProduct();
      }
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 删除成功
    deleteProduct() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deleteProduct({
            productId: item.id,
          }));
        });
        axios.all(api).then(() => {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('删除成功');
        });
      }
    },
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('productItem', JSON.stringify(item));
      this.$router.push({
        path: `/admin/product/productdetail/${item.id}`,
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
      getAllProducts(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.products.map((item) => {
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
      this.filter.page = 1;
      this.$refs.page.init();
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
  },
  mounted() {
    this.getData(this.filter);
  },
};

</script>
