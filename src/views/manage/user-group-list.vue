<style lang="scss">
@import './user-group-list.scss'

</style>
<template>
  <div class="main-container">
    <div class="main-list-content">
      <div class="table-list user-group-list">
        <div class="table-list-header clearfix mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除用户组</Button>
            <Button type="primary" icon="plus" @click="createData">创建用户组</Button>
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
              用户组名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="8">描述
              <sort-page 
                :sort-value="filter.order" 
                sort-name="description"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="10"></Col>
            </Row>
          </div>
          <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="6">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td width-limit" span="8">
                <span :title="item.description">{{item.description || '--'}}</span>
                  <!-- <Poptip placement="right" width="300" trigger="hover">
                    <span style="cursor: pointer;">{{item.description}}</span>
                    <div slot="title"><i>描述详情</i></div>
                    <div slot="content" @click.native.stop="doNothing">
                      <div class="pop-show-content">
                        <pre>{{item.description}}</pre>
                      </div>
                    </div>
                  </Poptip> -->
                </Col>
                <Col class="body-td" span="10">
                <div class="float-right pr-20">
                  <Tooltip content="编辑组信息" placement="top">
                    <Icon size="18" type="edit" @click.native.stop="updateUserGroup(item)"></Icon>
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
    <create-user-group ref="createUserGroup" @on-create-success="createSuccess"></create-user-group>
    <Modal title="移除用户组" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除用户组：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import axios from 'axios';
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getUserGroups, deleteUserGroup } from '../../models/service';
import paging from '../../components/page/paging';
import createUserGroup from '../../components/manage/create-user-group';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'userGroupList',
  components: {
    paging,
    createUserGroup,
    sortPage,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      allDataList: [],
      searchName: '', //  搜索名称
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
      },
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      deleteShowData: [],
      removeModal: false,
    };
  },
  methods: {
    doNothing() {},
    // 创建数据
    createData() {
      this.$refs.createUserGroup.createInit('create');
    },
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') {
          this.$Message.success('创建成功');
          this.getData(this.filter);
          this.viewDetail(data.user_group);
        } else if (msg === 'editgroup') {
          this.$Message.success('编辑成功');
          this.getData(this.filter);
        }
      }
    },
    // 修改用户组名,描述信息
    updateUserGroup(group) {
      this.$refs.createUserGroup.editInit(group, 'editgroup');
    },
    // 删除用户组
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
    // 移除用户组确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deleteUserGroup();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除成功
    deleteUserGroup() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deleteUserGroup({
            groupId: item.id,
            productId: this.filter.productId,
          }));
        });
        axios.all(api).then(() => {
          this.selectedData = [];
          this.deleteShowData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        });
      }
    },
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('userGroupItem', JSON.stringify(item));
      this.$router.push({
        path: `/manage/usergroupdetail/${item.id}/${this.filter.productId}`,
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.initFilter();
      // this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
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
    // 单选
    selectItem(item, index) {
      this.dataList[index].checked = !this.dataList[index].checked;
      this.selectedData = this.dataList.filter(plugin => plugin.checked);
      this.checkAll = this.selectedData.length === this.dataList.length;
    },
    // 翻页
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
    // 初始化过滤条件
    initFilter() {
      this.$refs.userGroupList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.selectedData = [];
      this.checkAll = false;
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      getUserGroups(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.user_groups.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
  },
  computed: {
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
    // 路径
    path() {
      return this.$route.path;
    },
  },
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.filter.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getData(this.filter);
  },
  beforeDestroy() {},
};

</script>
