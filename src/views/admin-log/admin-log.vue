<style lang="scss">
  @import './admin-log.scss'
</style>
<template>
  <div class="main-container">
    <div class="admin-log-list">
      <div class="table-list group-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <calendar-select placement="bottom-start" @on-date-change="dateChange"></calendar-select>
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
              <Col class="title-th" span="3">
              IP
              </Col>
              <Col class="title-th" span="5">API</Col>
              <Col class="title-th" span="2">方法类型</Col>
              <Col class="title-th" span="5">参数</Col>
              <Col class="title-th" span="2">操作结果</Col>
              <Col class="title-th" span="4">操作人</Col>
              <Col class="title-th" span="3">操作时间</Col>
            </Row>
          </div>
          <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <!-- @click.native="viewDetail(item)" -->
              <Row class="box-content-item" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="3">
                <span :title="item.ip">{{item.ip || '--'}}</span>
                </Col>
                <Col class="body-td width-limit" span="5">
                  <Poptip placement="right" width="400" trigger="hover">
                    <span style="color: #2d8cf0;cursor: pointer;">{{item.api || '--'}}</span>
                    <div slot="title"><i>API详情</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{getPre(item.api)}}</pre>
                        <!-- <pre>{{item.body}}</pre> -->
                      </div>
                    </div>
                  </Poptip>
                </Col>
                <Col class="body-td hidden-td" span="2">
                  {{item.method || '--'}}
                </Col>
                <Col class="body-td" span="5">
                  <Poptip placement="right" width="400">
                    <span style="color: #2d8cf0;cursor: pointer;">查看详情</span>
                    <div slot="title"><i>参数详情</i></div>
                    <div slot="content">
                      <div class="pop-show-content">
                        <pre>{{getPre(item.body)}}</pre>
                        <!-- <pre>{{item.body}}</pre> -->
                      </div>
                    </div>
                    <!-- <Button @click="test(item.body)">test</Button> -->
                  </Poptip>
                </Col>
                <Col class="body-td" span="2">
                  {{getResult(item.result)}}
                </Col>
                <Col class="body-td hidden-td" span="4">
                <span :title="item.operator">{{item.operator || '--'}}</span>
                </Col>
                <Col class="body-td" span="3">
                  {{item.time || '--'}}
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
  </div>
</template>
<script>
import _ from 'lodash';
// import axios from 'axios';
import bus from '../../libs/bus';
import { getOperateLog } from '../../models/service';
import paging from '../../components/page/paging';
import calendarSelect from '../../components/page/calendar-select';

export default {
  name: 'monitorGroup',
  components: {
    paging,
    calendarSelect,
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
      modalTitle: '',
      // 编辑与添加
      addModal: false,
      // 添加日志信息
      addInfo: {
        name: '',
        file_path: '',
      },
      editInfo: {},
      actionType: '',
      errorMsg: '',
      visibleBody: false,
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
    test(str) {
      const newStr = str.replace(/\n/g, '\\\\n').replace(/\r/g, '\\\\r');
      // eslint-disable-next-line
      // const obj = eval(`(${newStr})`);
      let obj = '';
      try {
        obj = JSON.parse(newStr);
      } catch (error) {
        if (error) {
          obj = str;
        }
      }
      return obj;
    },
    getPre(str) {
      if (str) {
        if (str.indexOf('}') > -1) {
          const newStr = str.replace(/\n/g, '\\\\n').replace(/\r/g, '\\\\r');
          let obj = '';
          try {
            obj = JSON.parse(newStr);
          } catch (error) {
            if (error) {
              obj = str;
              return str;
            }
          }
          if (typeof obj === 'object') {
            return JSON.stringify(obj, null, 2);
          }
          return newStr;
        }
        return str;
      }
      return str;
    },
    // 滚动条复位
    refresh_scroll() {
      window.scrollTo(0, 0);
    },
    // 查看详情
    viewDetail() {
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
      if (obj.start_time === obj.end_time) {
        delete obj.start_time;
        delete obj.end_time;
      }
      getOperateLog(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.operations;
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
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.filter.query = this.searchName;
      this.getData(this.filter);
    }, 300),
    // 刷新
    reload() {
      this.getData(this.filter);
    },
    getResult(result) {
      if (result) return '成功';
      return '失败';
    },
    initTime() {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      start.setSeconds(0);
      end.setSeconds(59);
      this.filter.start_time = bus.timeFormate(start, 'yyyy/MM/dd-hh:mm:ss');
      this.filter.end_time = bus.timeFormate(end, 'yyyy/MM/dd-hh:mm:ss');
      this.getData(this.filter);
    },
    dateChange(time) {
      this.filter.start_time = `${time[0]}:00`;
      this.filter.end_time = `${time[1]}:59`;
      this.filter.page = 1;
      this.getData(this.filter);
    },
  },
  mounted() {
    this.initTime();
    // bus.$on('on-date-change', (time) => {
    //   // this.filter.start_time = `${time[0]} 00:00:00`;
    //   // this.filter.end_time = `${time[1]} 00:00:00`;
    //   this.filter.start_time = `${time[0]}:00`;
    //   this.filter.end_time = `${time[1]}:59`;
    //   this.filter.page = 1;
    //   this.getData(this.filter);
    // });
  },
  beforeDestroy() {
    // bus.$off('on-date-change');
  },
};

</script>
