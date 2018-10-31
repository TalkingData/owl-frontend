<template>
  <div>
    <Modal :width="width" v-model="showModal" :title="modalTitle" @on-cancel="cancel">
      <Form ref="nameForm" :model="groupInfo" :label-width="80" v-if="!isEdit">
        <FormItem prop="name" label="用户组名" :rules="{ required: true, type: 'string', message: '用户组名不能为空', trigger: 'change'}">
          <Input v-model="groupInfo.name" :readonly="isEdit" placeholder="请输入用户组名"></Input>
        </FormItem>
        <FormItem prop="description" label="描述">
          <Input v-model="groupInfo.description" :readonly="isEdit" placeholder="请输入用户组描述"></Input>
        </FormItem>
        <Alert v-if="errorMsg" type="warning" show-icon>{{errorMsg}}</Alert>
      </Form>
      <div class="select-transfer" v-show="isEdit">
        <div class="clearfix">
          <div class="float-left">
            <Input style="width:200px; margin-right: 10px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
          </div>
        </div>
        <Row class="mt-5">
          <Tag color="blue">已选中用户：{{selectData.length}}人</Tag>
          <Tag v-for="(item, index) in selectShowData" :key="item.id" :name="index" closable @on-close="unSelectUser">{{ item.username }}</Tag>
          <a class="ellipsis" v-show="!showAllFlag && selectData.length > 10" href="javascript:;" title="显示全部" @click="showAllSelect">......</a>
        </Row>
        </Row>
        <paging ref="userPage" :total="total" @on-page-info-change="pageInfoChange">
          <Table ref="userTable" class="mt-5" slot="listTable" size="small" border 
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
  addUserGroups,
  getUserOutGroup,
  addUserInGroup,
  updateUserGroup,
  getUserOutPro,
  addUserInPro,
} from '../../models/service';
import paging from '../page/paging';

export default {
  name: 'createUserGroup',
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
      },
      searchName: '',
      // 用户列表列
      userColumn: [{
        type: 'selection',
        width: 60,
        align: 'center',
      }, {
        title: '名称',
        key: 'username',
        sortable: 'custom',
        minWidth: 160,
      }, {
        title: '邮箱',
        key: 'mail',
        sortable: 'custom',
        minWidth: 160,
      }, {
        title: '角色',
        key: 'role',
        sortable: 'custom',
        minWidth: 140,
        render: (h, params) => h('span', {}, this.getRoleStr(params.row.role)),
      }],
      showModal: false,
      // 用户组信息
      groupInfo: {
        name: '',
        description: '',
      },
      // 用户组ID
      groupId: 0,
      dataList: [], // 用户列表
      selectData: [], // 已选用户
      // 是否是编辑模式
      isEdit: false,
      isName: true, // 显示名字或者ip
      loading: false,
      msgInfo: '', // 操作方式
      modalTitle: '', // 弹出框抬头
      errorMsg: '', // 错误提示信息
      showAllFlag: false, // false只展示前10个,true全部展示
    };
  },
  computed: {
    width() {
      if (this.msgInfo === 'addgroupuser' || this.msgInfo === 'addprouser') {
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
    // 删除选中用户
    unSelectUser(event, index) {
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
      this.$refs.userPage.init();
      this.initFilter();
    },
    initFilter() {
      if (this.msgInfo === 'addgroupuser') {
        this.getUserOutGroup(this.filter);
      } else if (this.msgInfo === 'addprouser') {
        this.getUserOutPro(this.filter);
      }
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.$refs.userPage.init();
      this.filter.query = this.searchName.trim();
      this.initFilter();
    }, 300),
    // 获取用户组外用户列表
    getUserOutGroup(params) {
      // this.selectData = [];
      const obj = Object.assign({}, params);
      obj.productId = this.productId;
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getUserOutGroup(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          const arr = JSON.parse(JSON.stringify(res.data.users));
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
    // 获取产品线外用户列表
    getUserOutPro(params) {
      // this.selectData = [];
      const obj = Object.assign({}, params);
      obj.productId = this.productId;
      delete obj.groupId;
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getUserOutPro(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          const arr = JSON.parse(JSON.stringify(res.data.users));
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
      this.showModal = false;
      this.groupInfo.name = '';
      this.groupInfo.description = '';
      this.dataList = [];
      this.selectData = [];
      this.showAllFlag = false;
      if (this.$refs.nameForm) {
        this.$refs.nameForm.resetFields();
      }
      // this.filter.order = '';
    },
    // 弹窗确认
    confirmSave() {
      // 添加用户
      if (this.msgInfo === 'addgroupuser') {
        this.addUserInGroup();
      } else if (this.msgInfo === 'addprouser') {
        this.addUserInPro();
      } else {
        this.$refs.nameForm.validate((valid) => {
          if (valid) {
            if (this.msgInfo === 'editgroup') {
              this.updateUserGroup(); // 编辑
            } else if (this.msgInfo === 'create') {
              this.addUserGroups(); // 创建
            }
          }
        });
      }
    },
    // 创建用户组
    addUserGroups() {
      const param = Object.assign({}, this.groupInfo);
      param.productId = this.productId;
      addUserGroups(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            // 添加成功后触发回调
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = res.data.message || '该名称已存在';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 编辑用户组
    updateUserGroup() {
      updateUserGroup({
        productId: this.productId,
        id: this.groupId,
        name: this.groupInfo.name,
        description: this.groupInfo.description,
      }).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = res.data.message || '该名称已存在';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 给用户组添加用户
    addUserInGroup() {
      const arr = this.selectData.map(item => item.id);
      const params = {
        groupId: this.groupId,
        ids: arr,
        productId: this.productId,
      };
      if (this.selectData.length > 0) {
        addUserInGroup(params).then((res) => {
          if (res.status === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          }
        });
      } else {
        this.$Message.warning('未选择用户');
      }
    },
    // 给产品线添加用户
    addUserInPro() {
      const arr = this.selectData.map(item => item.id);
      const params = {
        ids: arr,
        productId: this.productId,
      };
      if (this.selectData.length > 0) {
        addUserInPro(params).then((res) => {
          if (res.status === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.showModal = false;
          }
        });
      } else {
        this.$Message.warning('未选择用户');
      }
    },
    // 创建组
    createInit(msg) {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.errorMsg = '';
      this.msgInfo = msg;
      this.modalTitle = '新建用户组';
      this.groupInfo.name = '';
      this.groupInfo.description = '';
      this.selectData = [];
      this.isEdit = false;
      this.showModal = true;
    },
    // 编辑组
    editInit(group, msg) {
      this.selectData = [];
      this.showAllFlag = false;
      this.filter.page = 1;
      this.filter.page_size = 10;
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.msgInfo = msg;
      this.errorMsg = '';
      this.filter.query = '';
      // this.filter.order = '';
      this.searchName = '';
      if (msg === 'addprouser') {
        this.modalTitle = '产品线添加用户';
        this.getUserOutPro(this.filter);
        this.isEdit = true;
        this.$refs.userPage.init();
        this.$refs.userPage.initSize();
      } else {
        this.groupInfo.name = group.name;
        this.groupInfo.description = group.description;
        this.groupId = group.id;
        if (msg === 'editgroup') {
          this.modalTitle = '编辑用户组';
          this.isEdit = false;
        } else if (msg === 'addgroupuser') {
          this.modalTitle = '用户组添加用户';
          this.isEdit = true;
          this.filter.groupId = group.id;
          this.filter.page = 1;
          this.$refs.userPage.init();
          this.$refs.userPage.initSize();
          this.getUserOutGroup(this.filter);
        }
      }
      this.showModal = true;
    },
    // 用户角色展示
    getRoleStr(num) {
      return num === 1 ? '管理员' : '用户';
    },
  },
  mounted() {},
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