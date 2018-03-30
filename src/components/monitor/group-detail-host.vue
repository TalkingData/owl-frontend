<style lang="scss">
@import './group-detail-host.scss'

</style>
<template>
  <div class="group-detail-host">
    <div class="clearfix mb-10">
      <div class="float-left">
        <Button icon="minus" @click="removeData('multiple')" :disabled="!disableObj.isRemove" type="primary">移除主机</Button>
        <Button type="primary" icon="plus" @click="createData">添加主机</Button>
      </div>
      <div class="float-right">
        <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </div>
    <!-- <div class="host-detail-plugin-content">
      <paging ref="userGroupList" :total="total" @on-page-info-change="pageInfoChange">
        <simpleTable slot="listTable" :columns="columns" :data="dataList" @on-select-row-data="userSelect"></simpleTable>
      </paging>
    </div> -->
    <div class="table-list">
      <div class="box-content">
        <div class="box-content-title">
          <Row>
            <Col class="title-th" span="5">
            <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>主机名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="hostname"
                @on-sort-change="handleSort"></sort-page>
            </Col>
            <Col class="title-th" span="4">IP地址
            <sort-page 
                :sort-value="filter.order" 
                sort-name="ip"
                @on-sort-change="handleSort"></sort-page></Col>
            <Col class="title-th" span="3">状态</Col>
            <Col class="title-th" span="4">最近更新时间
            <sort-page 
                :sort-value="filter.order" 
                sort-name="update_at"
                @on-sort-change="handleSort"></sort-page></Col>
            <Col class="title-th" span="3">空闲率
              <sort-page 
                :sort-value="filter.order" 
                sort-name="idle_pct"
                @on-sort-change="handleSort"></sort-page>
            </Col>
            <Col class="title-th" span="5">持续运行时间
              <sort-page 
                :sort-value="filter.order" 
                sort-name="uptime"
                @on-sort-change="handleSort"></sort-page></Col>
          </Row>
        </div>
        <paging :total="total" @on-page-info-change="pageInfoChange" ref="userGroupList">
          <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
            <Row class="box-content-item" v-for="(item, index) in dataList" :key="index">
              <Col class="body-td hidden-td" span="5">
              <Checkbox v-model="item.checked"  @click.native.stop="selectItem(item, index)"></Checkbox>
              <a :title="item.name || item.hostname" href="javascript:;" @click="viewDetail(item, index)">{{item.name || item.hostname || '--'}}</a>
              </Col>
              <Col class="body-td" span="4">{{item.ip || '--'}}</Col>
              <Col class="body-td" span="3">
                <Badge v-if="item.status==0" count="宕机" class="alert-count"></Badge>
                <Badge v-if="item.status==1" count="正常" class="ok-count"></Badge>
                <Badge v-if="item.status==3" count="新增" class="add-count"></Badge>
                  <Badge v-if="item.status!=3 && item.status!=0 && item.status!=1" count="未知" class="unknow-count"></Badge>
              </Col>
              <Col class="body-td" span="4">{{item.update_at || '--'}}</Col>
              <Col class="body-td" span="3">{{item.idle_pct}}%</Col>
              <Col class="body-td" span="5">
                {{getDuration(item.uptime) || '--'}}
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
    <create-host-group ref="createGroup" @on-create-success="createSuccess"></create-host-group>
    <Modal title="移除主机" v-model="removeModal">
      <Alert type="warning" show-icon>确定要移除主机：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.hostname}}</span>&nbsp;吗？</Alert>
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
import { getHostOfGroup, removeHostInGroup } from '../../models/service';
import paging from '../page/paging';
import simpleTable from '../charts/simple-table';
import createHostGroup from '../monitor/create-host-group';
import sortPage from '../page/sort-page';

export default {
  name: 'groupDetailHost',
  components: {
    paging,
    simpleTable,
    createHostGroup,
    sortPage,
  },
  props: {},
  data() {
    return {
      groupItem: {}, // 组信息
      // 过滤器
      filter: {
        productId: '',
        page_size: 10,
        page: 1,
        order: '',
      },
      searchName: '',
      total: 10,
      dataList: [], // 列表
      columns: [{
        title: '主机名',
        key: 'hostname',
      }, {
        title: 'ip',
        key: 'ip',
      }, {
        title: '状态',
        key: 'status',
      }, {
        title: '创建时间',
        key: 'create_at',
      }, {
        title: '升级时间',
        key: 'update_at',
      }],
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      removeModal: false,
      deleteShowData: [],
    };
  },
  methods: {
    // 选择主机
    userSelect(arr) {
      this.selectedData = arr;
    },
    // 获取数据初始化
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      const groupItem = localStorage.getItem('groupItem');
      this.groupItem = JSON.parse(groupItem);
      this.groupId = parseInt(this.$route.params.groupId, 10);
      this.filter.groupId = this.groupId;
      this.getData(this.filter);
    },
    // 获取数据// 获取组下主机列表
    getData(params) {
      this.checkAll = false;
      this.selectedData = [];
      const param = Object.assign({}, params);
      if (!param.query) delete param.query;
      if (!param.order) delete param.order;
      getHostOfGroup(param).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.hosts.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      // this.filter.page = 1;
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300),
    reload() {
      this.getData(this.filter);
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.userGroupList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
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
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('hostItemInfo', JSON.stringify(item));
      this.$router.push({
        path: `/monitor/grouphost/${item.id}/${this.groupId}/${this.filter.productId}`,
      });
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
    // 添加主机
    createData() {
      this.$refs.createGroup.editInit(this.groupItem, 'addgrouphost');
    },
    // 添加成功回调
    createSuccess(msg, data) {
      if (data && data.code === 200) {
        if (msg === 'addgrouphost') {
          this.$Message.success('添加成功');
          this.initFilter();
        }
      }
    },
    // 移除主机
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
    // 删除主机确认
    deleteConfirm() {
      if (this.deleteShowData.length) {
        this.removeHostInGroup();
      }
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 删除接口
    removeHostInGroup() {
      const arr = this.deleteShowData.map(item => item.id);
      const params = {
        productId: this.filter.productId,
        groupId: this.groupId,
        ids: arr,
      };
      removeHostInGroup(params).then((res) => {
        if (res.status === 200) {
          this.initFilter();
          this.selectedData = [];
          this.removeModal = false;
          this.$Message.success('删除成功');
        }
      });
    },
    getDuration(time) {
      if (time) {
        let minute = time / 60;
        let hour = 0;
        let day = 0;
        let year = 0;
        if (minute >= 1440) {
          hour = Math.floor(minute / 60);
          day = Math.floor(hour / 24);
          hour = Math.floor(hour % 24);
          minute = Math.floor(minute % 60);
          if (day >= 365) {
            year = Math.floor(day / 365);
            day = Math.floor(day % 365);
            return `${year}年${day}天${hour}小时${minute}分`;
          }
          return `${day}天${hour}小时${minute}分`;
        } else if (minute >= 60 && minute < 1440) {
          hour = Math.floor(minute / 60);
          minute = Math.floor(minute % 60);
          return `${hour}小时${minute}分`;
        }
        return `${Math.floor(minute)}分`;
      }
      return time;
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
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {
  },
};

</script>
