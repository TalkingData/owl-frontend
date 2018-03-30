<style lang="scss">
@import './plugin-detail.scss'

</style>
<template>
  <div class="main-container plugin-detail">
    <div class="main-list-content">
      <div class="common-detail-top clearfix">
        <div class="float-left">
          <span title="返回到插件列表页" @click="backTo" class="common-detail-top-title">插件列表&gt;</span>
          <span>&nbsp;插件名称 : {{pluginItem.name || '插件详情'}}</span>
        </div>
        <div class="float-right">
          <span>&nbsp;插件描述 : {{pluginItem.description || '插件描述'}}</span>
        </div>
      </div>
      <div class="table-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">移除主机组</Button>
            <Button type="primary" icon="plus" @click="createData">添加主机组</Button>
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
              <Col class="title-th" span="4">
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>主机组名称
              </Col>
              <Col class="title-th" span="4">所属产品线</Col>
              <Col class="title-th" span="4">创建者</Col>
              <Col class="title-th" span="4">创建时间</Col>
              <Col class="title-th" span="4">描述</Col>
              <Col class="title-th" span="4"></Col>
            </Row>
          </div>
          <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index" @click.native="selectItem(item, index)">
                <!-- @click.native.stop="selectItem(item, index)" -->
                <Col class="body-td hidden-td" span="4">
                <Checkbox v-model="item.checked" ></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="4" :title="item.product">{{item.product || '--'}}</Col>
                <Col class="body-td" span="4">
                  {{item.creator || '--'}}
                </Col>
                <Col class="body-td" span="4">
                  {{item.create_at || '--'}}
                </Col>
                <Col class="body-td hidden-td" span="4" :title="item.description">
                  {{item.description || '--'}}
                </Col>
                <Col class="body-td" span="4">
                  <div class="float-right pr-20">
                    <Tooltip content="移除" placement="top" class="ml-10">
                      <Icon size="18" type="ios-minus-outline" @click.native.stop="removeData(item)"></Icon>
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
    <create-plugin ref="createPlugin" @on-create-success="createSuccess"></create-plugin>
    <Modal title="移除主机组" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除主机组：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}({{item.product}})</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="deleteConfirm" type="primary">确定</Button>
        <Button @click="deleteCancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getGroupsInPlugin, removeGroupInPlugin } from '../../models/service';
import paging from '../../components/page/paging';
import createPlugin from '../../components/admin/plugin/create-plugin';

export default {
  name: 'userGroupList',
  components: {
    paging,
    createPlugin,
  },
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filter: { // 翻页
        page: 1,
        page_size: 10,
      },
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      pluginId: 0,
      pluginItem: {}, // 插件信息
      removeModal: false, // 删除弹出
      deleteShowData: [],
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: '/admin/plugin/pluginlist',
      });
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
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.page = 1;
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.userGroupList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 刷新
    reload() {
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.checkAll = false;
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      getGroupsInPlugin(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.host_groups.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
    // 初始化获取数据
    getDetailData() {
      this.pluginId = parseInt(this.$route.params.pluginId, 10); // 插件id
      const str = localStorage.getItem('pluginItem');
      const pluginItem = JSON.parse(str);
      this.pluginItem = pluginItem;
      this.filter.pluginId = this.pluginId;
      this.getData(this.filter);
    },
    // 操作--------------------------------------------------------
    // 创建数据
    createData() {
      this.$refs.createPlugin.editInit('addgroup', this.pluginItem);
    },
    // 创建成功
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        this.$Message.success('添加成功');
        this.initFilter();
      }
    },
    // 移除主机组
    removeData(obj) {
      if (obj === 'multiple') { // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const user = Object.assign({}, item);
          return user;
        });
      } else { // 移除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 删除主机组确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.removeGroupInPlugin();
      }
    },
    // 删除成功
    removeGroupInPlugin() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        pluginId: this.pluginId,
        ids: arr,
      };
      removeGroupInPlugin(params).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.selectedData = [];
          this.initFilter();
          this.removeModal = false;
          this.$Message.success('移除成功');
        }
      });
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
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
    this.getDetailData();
  },
  beforeDestroy() {},
};

</script>
