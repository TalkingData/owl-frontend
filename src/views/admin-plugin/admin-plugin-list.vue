<style lang="scss">
  @import './admin-plugin-list.scss'
</style>
<template>
  <div class="main-container">
    <div class="admin-plugin-list">
      <div class="table-list group-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">删除插件</Button>
            <Button type="primary" icon="plus" @click="createData">创建插件</Button>
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
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>
              插件名称
              </Col>
              <Col class="title-th" span="4">执行参数</Col>
              <Col class="title-th" span="3">执行间隔(秒)</Col>
              <Col class="title-th" span="3">超时时间(秒)</Col>
              <Col class="title-th" span="3">插件路径</Col>
              <Col class="title-th" span="4">校验和</Col>
              <Col class="title-th" span="3"></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="4">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.name">{{item.name || '--'}}</span>
                </Col>
                <!-- @click.native.stop="doNothing" -->
                <Col class="body-td width-limit" span="4" >
                  <Poptip placement="right" width="400" trigger="hover">
                    <span style="cursor: pointer;">{{item.args || '--'}}</span>
                    <div slot="title"><i>参数详情</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{item.args}}</pre>
                      </div>
                    </div>
                  </Poptip>
                </Col>
                <Col class="body-td" span="3">{{item.interval || '--'}}</Col>
                <Col class="body-td" span="3">
                  {{item.timeout}}
                </Col>
                <Col class="body-td width-limit" span="3">
                  <Poptip placement="left" width="300" trigger="hover" @click.native.stop="doNothing">
                    <span style="cursor: pointer;">{{item.path || '--'}}</span>
                    <div slot="title"><i>路径</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{item.path}}</pre>
                      </div>
                    </div>
                  </Poptip>
                </Col>
                <Col class="body-td width-limit" span="4">
                  <Poptip placement="left" width="300" trigger="hover" @click.native.stop="doNothing">
                    <span style="cursor: pointer;">{{item.checksum || '--'}}</span>
                    <div slot="title"><i>校验和详情</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{item.checksum}}</pre>
                      </div>
                    </div>
                  </Poptip>
                </Col>
                <Col class="body-td" span="3">
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
    <create-plugin ref="createPlugin" @on-create-success="createSuccess"></create-plugin>
    <Modal title="移除插件" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除插件：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
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
import { getAllPlugins, deletePlugin } from '../../models/service';
import createPlugin from '../../components/admin/plugin/create-plugin';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'monitorGroup',
  components: {
    createPlugin,
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
    // 创建插件
    createData() {
      this.$refs.createPlugin.editInit('create');
    },
    // 创建成功回调
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        this.reload();
        if (msg === 'create') { // 创建成功后跳转到插件详情页
          this.$Message.success('创建成功');
          this.viewDetail(data.plugin);
        } else if (msg === 'editPlugin') {
          this.$Message.success('编辑成功');
        }
      }
    },
    // 编辑插件
    editPlugin(group) {
      this.$refs.createPlugin.editInit('editPlugin', group);
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 删除插件
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
    // 移除插件确认
    deleteConfirm() {
      this.removeModal = false;
      if (this.deleteShowData.length) {
        this.deletePlugin();
      }
    },
    // 取消移除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 移除接口
    deletePlugin() {
      if (this.deleteShowData.length > 0) {
        const api = [];
        this.deleteShowData.forEach((item) => {
          api.push(deletePlugin({
            pluginId: item.id,
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
      localStorage.setItem('pluginItem', JSON.stringify(item));
      this.$router.push({
        path: `/admin/plugin/plugindetail/${item.id}`,
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
      getAllPlugins(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.plugins.map((item) => {
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
    doNothing() {},
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
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
      // this.filter.query = '';
      // this.filter.page = 1;
    },
  },
  mounted() {
    this.getData(this.filter);
  },
};

</script>
