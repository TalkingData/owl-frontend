<style lang="scss">
  @import './monitor-group.scss'
</style>
<template>
  <div class="main-container">
    <div class="monitor-container">
      <div class="table-list group-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除主机组</Button>
            <Button type="primary" icon="plus" @click="createData">创建主机组</Button>
          </div>
          <div class="float-right">
            <!-- <Select v-model="dataStatus" style="width:100px;">
              <Option v-for="status in statusList" :key="status.label" :label="status.label" :value="status.value">{{status.label}}</Option>
            </Select> -->
            <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
        <div class="box-content">
          <div class="box-content-title">
            <Row>
              <Col class="title-th" span="4">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>
              主机组名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="4">描述
              <sort-page 
                :sort-value="filter.order" 
                sort-name="description"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">创建人
              <sort-page 
                :sort-value="filter.order" 
                sort-name="creator"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">创建时间
              <sort-page 
                :sort-value="filter.order" 
                sort-name="create_at"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">最近更新时间
              <sort-page 
                :sort-value="filter.order" 
                sort-name="update_at"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4"></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="4">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="4">
                  <span :title="item.description">{{item.description || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="4">
                  <span :title="item.creator">{{item.creator || '--'}}</span>
                </Col>
                <Col class="body-td" span="4">
                  {{item.create_at}}
                </Col>
                <Col class="body-td" span="4">{{item.update_at || '--'}}</Col>
                <Col class="body-td" span="4">
                <div class="float-right pr-20">
                  <Tooltip content="Mute" placement="top">
                    <Icon size="18" type="edit" @click.native.stop="editGroup(item)"></Icon>
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
    <create-host-group ref="createGroup" @on-create-success="createSuccess"></create-host-group>
    <Modal title="移除主机组" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除主机组：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
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
import { getHostGroups, delHostGroup } from '../../models/service';
import createHostGroup from '../../components/monitor/create-host-group';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'monitorGroup',
  components: {
    createHostGroup,
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
    // 创建主机组
    createData() {
      this.$refs.createGroup.createInit('create');
    },
    // 创建成功回调
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'create') { // 创建成功后跳转到主机组详情页
          this.initFilter();
          this.$Message.success('创建成功');
          this.viewDetail(data.host_group);
        } else if (msg === 'editgroup') {
          this.$Message.success('编辑成功');
          this.getData(this.filter);
        }
      }
    },
    // 编辑主机组
    editGroup(group) {
      this.$refs.createGroup.editInit(group, 'editgroup');
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除主机组
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
    // 移除主机组确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.delHostGroup();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除成功
    delHostGroup() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(delHostGroup({
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
      localStorage.setItem('groupItem', JSON.stringify(item));
      this.$router.push({
        path: `/monitor/groupdetail/${item.id}/${this.filter.productId}`,
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
      getHostGroups(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.host_groups.map((item) => {
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
};

</script>
