<style lang="scss">
  @import './product-host.scss'
</style>
<template>
  <div class="main-container">
    <div class="product-host-container">
      <div class="table-list host-list">
        <div class="table-list-header clearfix mb-10">
          <div class="float-left" >
            <Button :disabled="!disableObj.isRemove" @click="removeData('multiple')" type="primary" icon="minus">删除主机</Button>
            <!-- <Button @click="addHost" type="primary" icon="plus">添加主机</Button> -->
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
              <Col class="title-th" span="5">
              <Checkbox v-if="isProduct" v-model="checkAll" @on-change="selectAll"></Checkbox>
              主机名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="hostname"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="4">IP地址
              <sort-page 
                :sort-value="filter.order" 
                sort-name="ip"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="3">状态</Col>
              <Col class="title-th" span="4">最近更新时间
                <sort-page 
                :sort-value="filter.order" 
                sort-name="update_at"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="3">空闲率
              <sort-page 
                :sort-value="filter.order" 
                sort-name="idle_pct"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="5">持续运行时间
              <sort-page 
                :sort-value="filter.order" 
                sort-name="uptime"
                @on-sort-change="handleSort"></sort-page></Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index">
                <Col class="body-td hidden-td" span="5">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
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
                {{getDuration(item.uptime)}}
                <div class="float-right pr-20">
                  <Tooltip content="删除" placement="top" class="ml-10" >
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
    <create-host-group ref="addHost" @on-create-success="addSuccess"></create-host-group>
    <Modal title="删除主机" v-model="removeModal">
      <Alert type="warning" show-icon>确定要删除主机：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.hostname}}</span>&nbsp;吗？</Alert>
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
// import md5 from 'md5';
// import Cookies from 'js-cookie';
// import bus from '../../libs/bus';
import {
  getAllHosts,
  deleteHost,
} from '../../models/service';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';
import createHostGroup from '../../components/monitor/create-host-group';

export default {
  name: 'productHost',
  components: {
    paging,
    sortPage,
    createHostGroup,
  },
  props: {
    // 是否是产品列表页
    isProduct: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dataList: [], // 表格数据,主机列表
      filter: {
        page_size: 10,
        page: 1,
        order: '',
      },
      total: 0, // 总数
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      statusList: [], // 筛选
      dataStatus: '', // 状态筛选
      searchName: '', // 搜索名称
      removeModal: false,
      deleteShowData: [], // 展示要删除的数据
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
    // 产品线添加主机
    addHost() {
      const productInfo = localStorage.getItem('productInfo');
      if (productInfo) {
        this.$refs.addHost.editInit(JSON.parse(productInfo), 'addProHost');
      }
    },
    // 添加出击回调
    addSuccess(msg, data) {
      if (data.code === 200) {
        this.$Message.success('添加成功');
        this.getData(this.filter);
      }
    },
    // 删除主机
    removeData(obj) {
      if (obj === 'multiple') { // 删除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 删除一个
        this.deleteShowData = [obj];
      }
      this.removeModal = true;
    },
    // 删除主机确认
    deleteConfirm() {
      if (this.deleteShowData.length) {
        this.deleteHost();
      }
    },
    // 取消删除
    deleteCancel() {
      this.removeModal = false;
      this.deleteShowData = [];
    },
    // 删除成功
    deleteHost() {
      const arr = this.deleteShowData.map((item) => {
        const params = {
          hostId: item.id,
        };
        return deleteHost(params);
      });
      axios.all(arr).then((res) => {
        if (res.length > 0) {
          let flag = true;
          res.forEach((item) => {
            if (item.status !== 200 || item.data.code !== 200) {
              flag = false;
            }
          });
          if (flag) {
            this.removeModal = false;
            this.selectedData = [];
            this.deleteShowData = [];
            this.initFilter();
            this.removeModal = false;
            this.$Message.success('删除成功');
          } else {
            this.$Message.error('删除失败');
          }
        }
      });
    },
    // 获取表格内容数据
    getData(params) {
      this.checkAll = false;
      this.selectedData = [];
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      if (!obj.order) delete obj.order;
      getAllHosts(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.hosts.map((item) => {
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
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
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
    // 查看主机组
    groupToStr(arr) {
      if (arr.length) {
        const gArr = arr.map(item => item.name);
        return gArr.join('/');
      }
      return '无主机组';
    },
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('hostItemInfo', JSON.stringify(item));
      this.$router.push({
        path: `/admin/monitor/hostdetail/${item.id}`,
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
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.filter.page = 1;
      this.$refs.page.init();
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      // this.filter.query = '';
      // this.filter.page = 1;
      this.getData(this.filter);
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
      return '--';
    },
    getHostStatus(arg) {
      const status = parseInt(arg, 10);
      let str = '';
      switch (status) {
        case 0:
          str = '故障';
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
    getHostStatusClass(arg) {
      const status = parseInt(arg, 10);
      let str = '';
      switch (status) {
        case 0:
          str = 'fail-status';
          break;
        case 1:
          str = 'normal-status';
          break;
        case 2:
          str = 'disable-status';
          break;
        case 3:
          str = 'new-status';
          break;
        default:
          str = '';
          break;
      }
      return str;
    },
    // //滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    numberSeparator(value) {
      if (value) {
        return value.toString().indexOf('.') > 0 ?
        value.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
         : value.toString().replace(/\B(?=(\d{3})+$)/g, ',');
      }
      return 0;
    },
  },
  mounted() {
    this.getData(this.filter);
  },
};

</script>
