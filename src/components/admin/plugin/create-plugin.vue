<template>
  <div>
    <Modal :width="width" v-model="showModal" :title="modalTitle" @on-cancel="cancel">
      <Form ref="nameForm" :model="pluginInfo" :label-width="80" v-if="!isEdit">
        <FormItem prop="name" label="插件名" :rules="{ required: true, type: 'string', message: '插件名不能为空', trigger: 'change'}">
          <Input v-model="pluginInfo.name" :readonly="isEdit" placeholder="请输入插件名"></Input>
        </FormItem>
        <FormItem prop="path" label="插件路径" :rules="{ required: true, type: 'string', message: '插件路径不能为空', trigger: 'change'}">
          <Input v-model="pluginInfo.path" :readonly="isEdit" placeholder="请输入插件路径"></Input>
        </FormItem>
        <FormItem prop="args" label="执行参数">
          <Input v-model="pluginInfo.args" :readonly="isEdit" placeholder="请输入执行参数"></Input>
        </FormItem>
        <FormItem prop="interval" label="执行间隔" :rules="{ required: true, type: 'number', message: '执行间隔不能为空', trigger: 'change'}">
          <InputNumber style="width: 180px;" :min="1" v-model="pluginInfo.interval" :readonly="isEdit" placeholder="请输入执行间隔"></InputNumber>
        </FormItem>
        <FormItem prop="timeout" label="超时时间" :rules="{ required: true, type: 'number', message: '超时时间不能为空', trigger: 'change'}">
          <InputNumber style="width: 180px;" :min="1" v-model="pluginInfo.timeout" :readonly="isEdit" placeholder="请输入超时时间"></InputNumber>
        </FormItem>
        <FormItem prop="checksum" label="校验和" :rules="{ required: true, type: 'string', message: '校验和不能为空', trigger: 'change'}">
          <Input v-model="pluginInfo.checksum" :readonly="isEdit" placeholder="请输入校验和"></Input>
        </FormItem>
        <FormItem prop="comment" label="备注">
          <Input v-model="pluginInfo.comment" :autosize="{ minRows: 2 }" type="textarea" :readonly="isEdit" placeholder="请输入备注"></Input>
        </FormItem>
        <Alert type="warning" show-icon v-if="errorMsg">{{errorMsg}}</Alert>
      </Form>
      <div class="input-select-all" v-show="isEdit">
        <div class="clearfix">
          <div class="float-left">
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          </div>
        </div>
        <Row class="mt-5">
          <Tag color="blue">已选中主机组：{{selectData.length}}人</Tag>
          <Tag v-for="(item, index) in selectShowData" :key="item.id" :name="index" closable @on-close="unSelect">{{ item.name }}</Tag>
          <a class="ellipsis" v-show="!showAllFlag && selectData.length > 10" title="显示全部" @click="showAllSelect">......</a>
        </Row>
        <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange">
          <Table ref="userTable" class="mt-5" size="small" border 
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
  createPlugin,
  editPlugin,
  getGroupsOutPlugin,
  addGroupsInPlugin,
} from '../../../models/service';
import paging from '../../page/paging';

export default {
  name: 'createPlugin',
  props: {},
  components: {
    paging,
  },
  data() {
    return {
      total: 0,
      filter: { // 翻页
        page: 1,
        page_size: 10,
        pluginId: 0,
      },
      searchName: '',
      // 主机列表列
      userColumn: [{
        type: 'selection',
        width: 60,
        align: 'center',
      }, {
        title: '主机组名称',
        key: 'name',
        sortable: 'custom',
      }, {
        title: '产品线',
        key: 'product',
        sortable: 'custom',
      }, {
        title: '创建者',
        key: 'creator',
        sortable: 'custom',
      }, {
        title: '描述',
        key: 'description',
        sortable: 'custom',
      }, {
        title: '创建时间',
        key: 'create_at',
        sortable: 'custom',
      }, {
        title: '升级时间',
        key: 'update_at',
        sortable: 'custom',
      }],
      showModal: false,
      // 插件信息
      pluginInfo: {
        name: '',
        path: '',
        args: '',
        interval: 60,
        timeout: 10,
        checksum: '',
        comment: '',
      },
      // 插件ID
      pluginId: 0,
      dataList: [], // 主机列表
      selectData: [], // 已选主机
      // 是否是编辑模式
      isEdit: false,
      msgInfo: '', // 操作方式
      modalTitle: '', // 弹出框抬头
      errorMsg: '', // 错误提示信息
      showAllFlag: false,
    };
  },
  computed: {
    width() {
      if (this.msgInfo === 'addgroup' || this.msgInfo === 'addProHost') {
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
    selectShowData() {
      if (this.showAllFlag) {
        const arr = this.selectData.map(item => item);
        return arr;
      }
      return this.selectData.slice(0, 10);
    },
  },
  beforeDestory() {},
  methods: {
    // 选择主机
    dataSelect(arr) {
      this.selectData = arr;
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
    // 删除选中主机组
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
        this.$refs.userTable.toggleSelect(tableIndex);
      } else {
        this.selectData.splice(index, 1);
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
    // 排序
    sortPage(obj) {
      if (obj.order === 'normal') {
        this.filter.order = '';
      } else {
        this.filter.order = `${obj.key}|${obj.order}`;
      }
      this.filter.page = 1;
      this.$refs.userGroupList.init();
      this.initFilter();
    },
    initFilter() {
      if (this.msgInfo === 'addgroup') {
        this.getGroupsOutPlugin(this.filter);
      }
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    // 初始化创建
    initInfo() {
      this.pluginInfo = {
        name: '',
        path: '',
        args: '',
        interval: 60,
        timeout: 10,
        checksum: '',
        comment: '',
      };
    },
    // 编辑与创建
    editInit(msg, group) {
      this.selectData = [];
      this.msgInfo = msg;
      this.errorMsg = '';
      this.filter.query = '';
      this.searchName = '';
      this.filter.page = 1;
      this.filter.page_size = 10;
      if (msg === 'create') {
        this.showModal = true;
        this.modalTitle = '新建插件';
        this.initInfo();
        this.isEdit = false;
        this.showModal = true;
      } else if (group) {
        this.showModal = true;
        this.pluginInfo = Object.assign({}, group);
        this.pluginId = group.id;
        if (msg === 'editPlugin') {
          this.modalTitle = '编辑插件';
          this.isEdit = false;
        } else if (msg === 'addgroup') {
          this.modalTitle = '添加主机组';
          this.isEdit = true;
          this.filter.pluginId = group.id;
          this.$refs.userGroupList.init();
          this.$refs.userGroupList.initSize();
          this.getGroupsOutPlugin(this.filter);
        }
      }
    },
    // 获取插件外主机列表
    getGroupsOutPlugin(params) {
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getGroupsOutPlugin(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          const arr = JSON.parse(JSON.stringify(res.data.host_groups));
          this.dataList = arr.map((item) => {
            const user = item;
            const selectUser = this.selectData.find(inItem => user.id === inItem.id);
            // eslint-disable-next-line
            user._checked = !!selectUser;
            return user;
          });
        }
      });
    },
    // 取消弹窗
    cancel() {
      this.errorMsg = '';
      this.showModal = false;
      // this.pluginInfo.name = '';
      this.initInfo();
      this.dataList = [];
      this.selectData = [];
      this.showAllFlag = false;
      this.$refs.nameForm.resetFields();
    },
    // 弹窗确认
    confirmSave() {
      this.errorMsg = '';
      if (this.msgInfo === 'addgroup') { // 添加主机
        this.addGroupsInPlugin(); // 插件
      } else {
        this.$refs.nameForm.validate((valid) => {
          if (valid) {
            if (this.msgInfo === 'editPlugin') {
              this.editPlugin(); // 编辑
            } else if (this.msgInfo === 'create') {
              this.createPlugin(); // 创建
            }
          }
        });
      }
    },
    // 创建插件
    createPlugin() {
      const param = Object.assign({}, this.pluginInfo);
      delete param.id;
      createPlugin(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = '该名称已经存在，请修改';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 编辑插件
    editPlugin() {
      const param = Object.assign({}, this.pluginInfo);
      delete param.checked;
      editPlugin(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = '该名称已经存在，请修改';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 给插件添加主机
    addGroupsInPlugin() {
      const arr = this.selectData.map(item => item.id);
      const params = {
        pluginId: this.pluginId,
        ids: arr,
      };
      if (this.selectData.length > 0) {
        addGroupsInPlugin(params).then((res) => {
          if (res.status === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          }
        });
      } else {
        this.$Message.warning('未选择主机');
      }
    },
  },
  mounted() {},
};

</script>
<style scoped lang="scss">
  .input-select-all {
    .ellipsis {
      font-size: 18px;
      font-weight: bold;
    }
  }
</style>