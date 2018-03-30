<style lang="scss">
  @import './admin-script-list.scss'
</style>
<template>
  <div class="main-container">
    <div class="admin-script-list">
      <div class="table-list group-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除脚本</Button>
            <Button type="primary" icon="plus" @click="createData">创建脚本</Button>
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
              <Col class="title-th" span="6">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>
              脚本名称
              </Col>
              <Col class="title-th" span="12">文件路径</Col>
              <Col class="title-th" span="6"></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="6">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td width-limit" span="12">
                  <Poptip placement="right" width="400" trigger="hover">
                    <span style="cursor: pointer;">{{item.file_path || '--'}}</span>
                    <div slot="title"><i>文件路径</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{item.file_path}}</pre>
                      </div>
                    </div>
                  </Poptip>
                </Col>
                <Col class="body-td" span="6">
                  <div class="float-right pr-20">
                    <Tooltip content="编辑" placement="top">
                      <Icon size="18" type="edit" @click.native.stop="editPlugin(item)"></Icon>
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
    <Modal v-model="addModal" :title="modalTitle">
      <Form :model="addInfo" ref="addInfo">
        <Form-item :label-width="80" label="名称" prop="name" :rules="{ required: true, type: 'string', trigger: 'change', message: '请输入脚本名称'}">
          <Input v-model="addInfo.name" placeholder="请输入脚本名称"></Input>
        </Form-item>
        <!-- :rules="{ required: true, type: 'string', trigger: 'change', message: '请输入脚本文件路径'}" -->
        <Form-item :label-width="80" label="文件路径" prop="file_path" :rules="pathRules">
          <Input v-model="addInfo.file_path" placeholder="请输入脚本文件路径"></Input>
        </Form-item>
        <Alert type="warning" show-icon v-if="errorMsg">{{errorMsg}}</Alert>
      </Form>
      <div slot="footer">
        <Button @click="addModal = false">取消</Button>
        <Button @click="addConfirm" type="primary">保存</Button>
      </div>
    </Modal>
    <Modal title="移除脚本" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除脚本：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import axios from 'axios';
import Util from '../../libs/utils';
import { getScripts, addScript, updateScript, removeScript } from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'monitorGroup',
  components: {
    paging,
  },
  data() {
    return {
      saveDataList: [], // 作为备份的数据列表
      allDataList: [],
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
      },
      total: 0, // 总数
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      statusList: [], // 筛选
      dataStatus: '',
      searchName: '', // 搜索名称
      deleteShowData: [],
      removeModal: false,
      modalTitle: '',
      // 编辑与添加
      addModal: false,
      // 添加脚本信息
      addInfo: {
        name: '',
        file_path: '',
      },
      editInfo: {},
      actionType: '',
      errorMsg: '',
      pathRules: [{
        validator: Util.validatePath,
        trigger: 'change',
        required: true,
      }],
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
  },
  methods: {
    // 创建脚本
    createData() {
      this.actionType = 'create';
      this.modalTitle = '创建脚本';
      this.addModal = true;
      this.addInfo.name = '';
      this.addInfo.file_path = '';
    },
    // 编辑脚本
    editPlugin(item) {
      this.actionType = 'edit';
      this.modalTitle = '编辑脚本';
      this.addModal = true;
      this.addInfo.name = item.name;
      this.addInfo.file_path = item.file_path;
      this.editInfo = item;
    },
    // 添加脚本
    addConfirm() {
      this.errorMsg = '';
      this.$refs.addInfo.validate((valid) => {
        if (valid) {
          if (this.actionType === 'create') {
            addScript({
              name: this.addInfo.name,
              file_path: this.addInfo.file_path,
            }).then((res) => {
              if (res.status === 200) {
                if (res.data.code === 200) {
                  this.$Message.success('创建成功');
                  this.addModal = false;
                  this.getData();
                } else {
                  this.errorMsg = res.data.message || '该名称已存在';
                }
              } else {
                this.errorMsg = res.data;
              }
            });
          } else if (this.actionType === 'edit') {
            updateScript({
              id: this.editInfo.id,
              name: this.addInfo.name,
              file_path: this.addInfo.file_path,
            }).then((res) => {
              if (res.status === 200) {
                if (res.data.code === 200) {
                  this.$Message.success('修改成功');
                  this.addModal = false;
                  this.getData();
                } else {
                  this.errorMsg = res.data.message || '该名称已存在';
                }
              } else {
                this.errorMsg = res.data;
              }
            });
          }
        }
      });
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除脚本
    removeData(obj) {
      if (obj === 'multiple') { // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 移除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 移除脚本确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.removeScript();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除接口
    removeScript() {
      if (this.deleteShowData.length > 0) {
        let ids = '?';
        this.deleteShowData.forEach((item, index) => {
          if (index === 0) {
            ids += `script_id=${item.id}`;
          } else {
            ids += `&script_id=${item.id}`;
          }
        });
        const params = {
          param: ids,
        };
        removeScript(params).then((res) => {
          if (res.status === 200) {
            this.selectedData = [];
            this.deleteShowData = [];
            this.initFilter();
            this.getData();
            this.removeModal = false;
            this.$Message.success('移除成功');
          } else {
            this.$Message.error('移除失败');
          }
        });
      }
    },
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('scriptItem', JSON.stringify(item));
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
    },
    // 获取表格内容数据
    getData() {
      this.selectedData = [];
      this.checkAll = false;
      // const obj = Object.assign({}, params);
      // if (!obj.query) delete obj.query;
      getScripts().then((res) => {
        if (res.status === 200) {
          this.saveDataList = res.data.scripts.map((item) => {
            const host = item;
            host.checked = false;
            return host;
          });
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              obj.checked = false;
              return obj.name.indexOf(this.searchName) > -1 ||
               obj.file_path.indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = res.data.scripts.map((item) => {
              const host = item;
              host.checked = false;
              return host;
            });
          }
          this.total = this.allDataList.length;
          const start = (this.filter.page - 1) * this.filter.page_size;
          const end = this.filter.page * this.filter.page_size;
          this.dataList = this.allDataList.slice(start, end);
          // this.dataList = this.allDataList.slice(0, this.filter.page_size);
        } else {
          this.total = 0;
          this.dataList = [];
          this.allDataList = [];
          this.saveDataList = [];
        }
      });
    },
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      // this.getData(this.filter);
      this.allDataList = this.allDataList.map((item) => {
        const obj = item;
        obj.checked = false;
        return obj;
      });
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
      this.selectedData = [];
      this.checkAll = false;
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
      this.initFilter();
      this.checkAll = false;
      this.filter.query = this.searchName;
      // this.getData(this.filter);
      if (this.searchName) {
        this.allDataList = this.saveDataList.filter((item) => {
          const obj = item;
          obj.checked = false;
          return obj.name.indexOf(this.searchName) > -1 ||
           obj.file_path.indexOf(this.searchName) > -1;
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
    // 刷新
    reload() {
      // this.searchName = '';
      // this.initFilter();
      this.getData();
    },
  },
  mounted() {
    this.getData();
  },
};

</script>
