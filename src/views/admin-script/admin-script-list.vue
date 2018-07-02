<style lang="scss">
  @import './admin-script-list.scss'
</style>
<template>
  <div class="main-container admin-script-list">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
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
      <div class="table-list group-list">
        <div class="box-content">
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <Table slot="listTable" size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              no-data-text="暂无数据"
              @on-select-all="selectAll"
              @on-selection-change="selectItem"
            ></Table>
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
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '脚本名称',
          key: 'name',
          width: 180,
        }, {
          title: '文件路径',
          key: 'file_path',
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
                this.editPlugin(params.row);
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
    },
    // 获取表格内容数据
    getData() {
      this.selectedData = [];
      this.checkAll = false;
      // const obj = Object.assign({}, params);
      // if (!obj.query) delete obj.query;
      getScripts().then((res) => {
        if (res.status === 200) {
          this.saveDataList = res.data.scripts;
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              return obj.name.indexOf(this.searchName) > -1 ||
               obj.file_path.indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = res.data.scripts;
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
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
      this.selectedData = [];
      this.checkAll = false;
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
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
          return obj.name.indexOf(this.searchName) > -1 ||
           obj.file_path.indexOf(this.searchName) > -1;
        });
      } else {
        this.allDataList = this.saveDataList.map((item) => {
          const obj = Object.assign({}, item);
          return obj;
        });
      }
      this.total = this.allDataList.length;
      this.dataList = this.allDataList.slice(0, this.filter.page_size);
    }, 300),
    // 刷新
    reload() {
      this.getData();
    },
  },
  mounted() {
    this.getData();
  },
};

</script>
