<template>
  <div>
    <Modal :width="width" v-model="showModal" :title="modalTitle">
      <Form ref="nameForm" :model="groupInfo" :label-width="80" v-if="!isEdit">
        <Form-item prop="name" label="主机组名" :rules="{ required: true, type: 'string', message: '主机组名不能为空', trigger: 'change'}">
          <Input v-model="groupInfo.name" :readonly="isEdit" placeholder="请输入主机组名"></Input>
        </Form-item>
        <Form-item prop="description" label="描述">
          <Input v-model="groupInfo.description" :readonly="isEdit" placeholder="请输入主机组描述"></Input>
        </Form-item>
        <Alert type="warning" show-icon v-if="errorMsg">{{errorMsg}}</Alert>
      </Form>
      <div class="select-transfer" v-show="isEdit">
        <div class="clearfix">
          <div class="float-left">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          </div>
        </div>
        <Row class="mt-5">
          <Tag color="blue">已选中主机：{{selectData.length}}台</Tag>
          <Tag v-for="(item, index) in selectShowData" :key="item.id" :name="index" closable @on-close="unSelect">{{ item.hostname }}</Tag>
          <a class="ellipsis" v-show="!showAllFlag && selectData.length > 10" href="javascript:;" title="显示全部" @click="showAllSelect">......</a>
        </Row>
        <paging ref="hostPage" :total="total" @on-page-info-change="pageInfoChange">
          <Table ref="hostTable" class="mt-5" slot="listTable" size="small" border 
          :columns="userColumn" 
          :data="dataList"
          :height="tableHeight"
          @on-sort-change="sortPage"
          @on-selection-change="selectChange"></Table>
        </paging>
      </div>
      <div slot="footer">
        <Button @click="cancel">取消</Button>
        <Button type="primary" @click="confirmSave">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import {
  addHostGroups,
  getHostOutGroup,
  addHostInGroup,
  updateHostGroup,
  getHostOutPro,
  addHostInPro,
} from '../../models/service';
import paging from '../page/paging';

export default {
  name: 'createHostGroup',
  props: {},
  components: {
    paging,
  },
  data() {
    return {
      productId: '',
      total: 0,
      filter: { // 翻页
        page: 1,
        page_size: 10,
        groupId: 0,
      },
      searchName: '',
      checkAll: false, // 本页是否全选
      // 主机列表列
      userColumn: [{
        type: 'selection',
        width: 60,
        align: 'center',
      }, {
        title: '主机名',
        key: 'hostname',
        sortable: 'custom',
      }, {
        title: 'ip',
        key: 'ip',
        sortable: 'custom',
      }, {
        title: '状态',
        key: 'status',
        sortable: 'custom',
        render: (h, params) => h('span', {}, this.getHostStatus(params.row.status)),
      }, {
        title: '创建时间',
        key: 'create_at',
        sortable: 'custom',
      }, {
        title: '空闲率',
        key: 'idle_pct',
        sortable: 'custom',
        render: (h, params) => h('span', {}, `${params.row.idle_pct}%`),
      }],
      showModal: false,
      // 主机组信息
      groupInfo: {
        name: '',
        description: '',
      },
      // 主机组ID
      groupId: 0,
      dataList: [], // 主机列表
      selectData: [], // 已选主机
      // 是否是编辑模式
      isEdit: false,
      msgInfo: '', // 操作方式
      modalTitle: '', // 弹出框抬头
      errorMsg: '', // 错误提示信息
      showAllFlag: false, // false只展示前10个,true全部展示
    };
  },
  methods: {
    // 删除选中主机
    unSelect(event, index) {
      let tableIndex = -1;
      let inTableFlag = false;
      this.dataList.forEach((item, innerIndex) => {
        if (item.id === this.selectData[index].id) {
          tableIndex = innerIndex;
          inTableFlag = true;
        }
      });
      if (inTableFlag) {
        this.$refs.hostTable.toggleSelect(tableIndex);
      } else {
        this.selectData.splice(index, 1);
      }
    },
    selectChange(arr) {
      if (this.selectData.length > 0) {
        this.dataList.forEach((item) => {
          const index = this.selectData.findIndex(inItem => item.id === inItem.id);
          if (index > -1) this.selectData.splice(index, 1);
        });
        arr.forEach((item) => {
          const obj = item;
          // eslint-disable-next-line
          obj._checked = true;
          this.selectData.push(obj);
        });
      } else {
        this.selectData = arr.map(item => item);
      }
    },
    showAllSelect() {
      this.showAllFlag = true;
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.initFilter();
    },
    initFilter() {
      if (this.msgInfo === 'addprohost') {
        this.getHostOutPro(this.filter);
      } else if (this.msgInfo === 'addgrouphost') {
        this.getHostOutGroup(this.filter);
      }
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.$refs.hostPage.init();
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    // 排序
    sortPage(obj) {
      if (obj.order === 'normal') {
        this.filter.order = '';
      } else {
        this.filter.order = `${obj.key}|${obj.order}`;
      }
      this.filter.page = 1;
      this.$refs.hostPage.init();
      this.initFilter();
    },
    // 创建组
    createInit(msg) {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.errorMsg = '';
      this.msgInfo = msg;
      this.modalTitle = '新建主机组';
      this.groupInfo.name = '';
      this.groupInfo.description = '';
      this.selectData = [];
      this.isEdit = false;
      this.showModal = true;
    },
    // 编辑组
    editInit(group, msg) {
      this.filter.page = 1;
      this.filter.page_size = 10;
      this.selectData = [];
      this.showAllFlag = false;
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.msgInfo = msg;
      this.errorMsg = '';
      this.filter.query = '';
      this.searchName = '';
      // 产品线添加主机
      if (msg === 'addprohost') {
        this.modalTitle = '产品线添加主机';
        this.isEdit = true;
        this.$refs.hostPage.init();
        this.$refs.hostPage.initSize();
        this.getHostOutPro(this.filter);
      } else { // 主机组操作
        this.groupInfo.name = group.name;
        this.groupInfo.description = group.description;
        this.groupId = group.id;
        if (msg === 'editgroup') {
          this.modalTitle = '编辑主机组';
          this.isEdit = false;
        } else if (msg === 'addgrouphost') {
          this.modalTitle = '主机组添加主机';
          this.isEdit = true;
          this.filter.groupId = group.id;
          this.$refs.hostPage.init();
          this.$refs.hostPage.initSize();
          this.getHostOutGroup(this.filter);
        }
      }
      this.showModal = true;
    },
    // 获取主机组外主机列表
    getHostOutGroup(params) {
      // this.selectData = [];
      const obj = Object.assign({}, params);
      obj.productId = this.productId;
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getHostOutGroup(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          const arr = JSON.parse(JSON.stringify(res.data.hosts));
          this.dataList = arr.map((item) => {
            const host = item;
            const selectObj = this.selectData.find(inItem => host.id === inItem.id);
            // eslint-disable-next-line
            host._checked = !!selectObj;
            return host;
          });
        }
      });
    },
    // 获取产品线外的主机
    getHostOutPro(params) {
      // this.selectData = [];
      const obj = Object.assign({}, params);
      obj.productId = this.productId;
      delete obj.groupId;
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getHostOutPro(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          const arr = JSON.parse(JSON.stringify(res.data.hosts));
          this.dataList = arr.map((item) => {
            const host = item;
            const selectObj = this.selectData.find(inItem => host.id === inItem.id);
            // eslint-disable-next-line
            host._checked = !!selectObj;
            return host;
          });
        }
      });
    },
    // 取消弹窗
    cancel() {
      this.filter.page = 1;
      this.filter.page_size = 10;
      this.$refs.hostPage.init();
      this.errorMsg = '';
      this.showModal = false;
      this.groupInfo.name = '';
      this.dataList = [];
      this.selectData = [];
      this.showAllFlag = false;
      // this.filter.order = '';
    },
    // 弹窗确认
    confirmSave() {
      this.errorMsg = '';
      if (this.msgInfo === 'addgrouphost') { // 添加主机
        this.addHostInGroup(); // 主机组
      } else if (this.msgInfo === 'addprohost') {
        this.addHostInPro(); // 产品线
      } else {
        this.$refs.nameForm.validate((valid) => {
          if (valid) {
            if (this.msgInfo === 'editgroup') {
              this.updateHostGroup(); // 编辑
            } else if (this.msgInfo === 'create') {
              this.addHostGroups(); // 创建
            }
          }
        });
      }
    },
    // 创建主机组
    addHostGroups() {
      const param = Object.assign({}, this.groupInfo);
      param.productId = this.productId;
      addHostGroups(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          } else {
            this.errorMsg = '该名称已经存在，请修改';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 编辑主机组
    updateHostGroup() {
      updateHostGroup({
        productId: this.productId,
        id: this.groupId,
        name: this.groupInfo.name,
        description: this.groupInfo.description,
      }).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          } else {
            this.errorMsg = '该名称已经存在，请修改';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 给主机组添加主机
    addHostInGroup() {
      const arr = this.selectData.map(item => item.id);
      const params = {
        productId: this.productId,
        groupId: this.groupId,
        ids: arr,
      };
      if (this.selectData.length > 0) {
        addHostInGroup(params).then((res) => {
          if (res.status === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          }
        });
      } else {
        this.$Message.warning('未选择主机');
      }
    },
    // 给产品线添加主机
    addHostInPro() {
      const arr = this.selectData.map(item => item.id);
      const params = {
        productId: this.productId,
        ids: arr,
      };
      if (this.selectData.length > 0) {
        addHostInPro(params).then((res) => {
          if (res.status === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          }
        });
      } else {
        this.$Message.warning('未选择主机');
      }
    },
    getHostStatus(arg) {
      const status = parseInt(arg, 10);
      let str = '';
      switch (status) {
        case 0:
          str = '宕机';
          break;
        case 1:
          str = '正常';
          break;
        case 2:
          str = '禁用';
          break;
        case 3:
          str = '新增';
          break;
        default:
          str = '';
          break;
      }
      return str;
    },
  },
  mounted() {},
  beforeDestory() {},
  watch: {
    isCheckAll(val) {
      this.checkAll = val;
    },
  },
  computed: {
    width() {
      if (this.msgInfo === 'addgrouphost' || this.msgInfo === 'addprohost') {
        return 80;
      }
      return 720;
    },
    tableHeight() {
      if (this.dataList.length >= 8) {
        return 360;
      }
      return '';
    },
    isCheckAll() {
      if (this.dataList.length > 0 && this.selectData.length > 0) {
        if (this.selectData.length >= this.dataList.length) {
          let allFlag = true;
          this.dataList.forEach((item) => {
            const obj = this.selectData.find(inItem => inItem.id === item.id);
            if (!obj) allFlag = false;
          });
          return allFlag;
        }
        return false;
      }
      return false;
    },
    selectShowData() {
      if (this.showAllFlag) {
        const arr = this.selectData.map(item => item);
        return arr;
      }
      return this.selectData.slice(0, 10);
    },
  },
};

</script>
<style scoped lang="scss">

  .select-transfer {
    .ellipsis {
      font-size: 18px;
      font-weight: bold;
    }
  }
</style>