'<style lang="scss">
@import './alarm-event-list.scss'

</style>
<template>
  <div class="main-container alarm-event">
    <div class="alarm-content">
      <div class="table-list event-list">
        <div class="table-list-header clearfix  mb-10">
          <div class="float-left">
            <Dropdown placement="bottom-start" trigger="click" @on-click="awareData">
              <Button :disabled="!disableObj.isRemove" type="primary">知悉</Button>
              <DropdownMenu slot="list">
                <DropdownItem name="1h">1h</DropdownItem>
                <DropdownItem name="4h">4h</DropdownItem>
                <DropdownItem name="8h">8h</DropdownItem>
                <DropdownItem name="1d">1天</DropdownItem>
                <DropdownItem name="1w">1周</DropdownItem>
                <!-- <DropdownItem name="forever">forever</DropdownItem> -->
              </DropdownMenu>
            </Dropdown>
            <!-- <Button @click="removeData" :disabled="!disableObj.isRemove" type="primary">删除</Button> -->
          </div>
          <div class="float-right">
            <Select v-model="alarmStatus" style="width:100px;" @on-change="statusSelect">
              <Option v-for="status in statusList" :key="status.label" :label="status.label" :value="status.value">{{status.label}}</Option>
            </Select>
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
              <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>规则名称
              <sort-page 
                :sort-value="filter.order" 
                sort-name="strategy_name"
                @on-sort-change="handleSort"></sort-page>
              </Col>
              <Col class="title-th" span="4">告警设备
              <sort-page 
                :sort-value="filter.order" 
                sort-name="host_name"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="3">IP地址<sort-page 
                :sort-value="filter.order" 
                sort-name="ip"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="2">报警次数<sort-page 
                :sort-value="filter.order" 
                sort-name="count"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="2">状态<sort-page 
                :sort-value="filter.order" 
                sort-name="status"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">最近更新时间<sort-page 
                :sort-value="filter.order" 
                sort-name="update_time"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="4">报警知悉过期时间<sort-page 
                :sort-value="filter.order" 
                sort-name="aware_end_time"
                @on-sort-change="handleSort"></sort-page></Col>
              <Col class="title-th" span="2"></Col>
            </Row>
          </div>
          <paging ref="eventList" :total="total" @on-page-info-change="pageInfoChange">
            <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
              <Row class="box-content-item cursor-pointer" v-for="(item, index) in dataList" :key="index" @click.native="viewDetail(item)">
                <Col class="body-td hidden-td" span="3">
                <Checkbox v-model="item.checked" @click.native.stop="selectItem(item, index)"></Checkbox>
                <span :title="item.strategy_name">{{item.strategy_name || '--'}}</span>
                </Col>
                <Col class="body-td hidden-td" span="4" :title="item.host_name">{{item.host_name || '--'}}</Col>
                <Col class="body-td" span="3">{{item.ip || '--'}}</Col>
                <Col class="body-td" span="2">{{item.count}} / {{item.alarm_count}}</Col>
                <Col class="body-td" span="2">
                  <Badge v-if="item.status===1" count="活跃" class="alert-count"></Badge>
                  <Badge v-if="item.status===2" count="知悉" class="unknow-count"></Badge>
                  <Badge v-if="item.status===3" count="恢复" class="ok-count"></Badge>
                </Col>
                <Col class="body-td" span="4">{{item.update_time || '--'}}</Col>
                <Col class="body-td" span="4">{{item.status===2 ? getTimeLast(item.aware_end_time) : '--'}}</Col>
                <Col class="body-td" span="2">
                  <div class="float-right pr-20">
                    <Poptip v-model="item.muteVisible" placement="left">
                      <Icon size="18" type="android-volume-up" @click.native.stop="showMute(index)"></Icon>
                      <!-- <div slot="title"><i>自定义标题</i></div> -->
                      <div slot="content">
                        <Button @click.stop="awareData('1h', item, index)">1h</Button>
                        <Button @click.stop="awareData('4h', item, index)">4h</Button>
                        <Button @click.stop="awareData('8h', item, index)">8h</Button>
                        <Button @click.stop="awareData('1d', item, index)">1天</Button>
                        <Button @click.stop="awareData('1w', item, index)">1周</Button>
                      </div>
                    </Poptip>
                    <!-- <Tooltip content="关闭" placement="top" class="ml-10">
                      <Icon size="18" type="close-circled" @click.native.stop="closeAlarm"></Icon>
                    </Tooltip> -->
                    <!-- <Tooltip content="删除" placement="top" class="ml-10">
                      <Icon size="18" type="trash-a" @click.native.stop="deleteAlarm"></Icon>
                    </Tooltip> -->
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
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { getEvents, awareEvent } from '../../models/service';
import paging from '../../components/page/paging';
import sortPage from '../../components/page/sort-page';

export default {
  name: 'alarmEvent',
  components: {
    paging,
    sortPage,
  },
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      alarmStatus: 0, // 全部默认
      statusList: [{
        label: '全部',
        value: 0,
      }, {
        label: '活跃',
        value: 1,
      }, {
        label: '已知悉',
        value: 2,
      }, {
        label: '已关闭',
        value: 3,
      }],
      isAddStatus: false, // 是否是添加模式
      filter: { // 翻页
        page: 1,
        page_size: 10,
        productId: '',
      },
      pageArr: [10, 50, 100, 200, 500], // 页数
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      editPluginInfo: {}, // 正在编辑插件信息
      pluginId: '',
    };
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isCorrelate: true,
        };
      }
      return {
        isRemove: false,
        isCorrelate: false,
      };
    },
    // 路径
    path() {
      return this.$route.path;
    },
  },
  watch: {
    path() {
      this.judge();
    },
  },
  methods: {
    closeAlarm() {}, // 关闭
    deleteAlarm() {}, // 删除
    // 查看详情
    viewDetail(item) {
      localStorage.setItem('eventItem', JSON.stringify(item));
      this.$router.push({
        path: `/alarm/event/${item.id}/${this.filter.productId}`,
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName;
      this.initFilter();
    }, 300), // 搜索
    removeData() {}, // 删除
    reload() {
      // this.filter.page = 1;
      this.getData(this.filter);
    }, // 刷新
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
    // 添加数据
    addData() {
      this.isAddStatus = !this.isAddStatus;
    },
    // 状态筛选
    statusSelect(value) {
      if (value === 0) {
        delete this.filter.status;
        this.getData(this.filter);
      } else {
        this.filter.status = value;
        this.initFilter();
      }
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
      this.$refs.eventList.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.checkAll = false;
      const param = Object.assign({}, params);
      if (param.query === '') delete param.query;
      if (param.order === '') delete param.order;
      getEvents(param).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.total = res.data.total;
          this.dataList = res.data.events.map((item) => {
            const obj = item;
            obj.checked = false;
            obj.muteVisible = false;
            return obj;
          });
        }
      });
    },
    // 初始化,判断是否是策略下列表
    judge() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      // 当有策略ID的时候,修改filter配置
      if (this.$route.params.strategyId) {
        this.filter.strategy_id = this.$route.params.strategyId;
        this.filter.status = this.$route.params.status;
        this.alarmStatus = parseInt(this.$route.params.status, 10);
      } else {
        delete this.filter.strategy_id;
        this.alarmStatus = 0;
        this.getData(this.filter);
      }
    },
    // 操作--------------------------------------------------------
    // 知悉告警,对接接口
    awareEvent(params) {
      awareEvent(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success('已知悉成功');
          this.getData(this.filter);
        }
      });
    },
    showMute(index) {
      this.dataList[index].muteVisible = true;
      this.dataList.forEach((item, i) => {
        const obj = item;
        if (i !== index) obj.muteVisible = false;
      });
    },
    // 知悉告警
    awareData(name, obj, count) {
      const time = this.getAwareTime(name);
      let ids = '?';
      if (obj) {
        // 操作一组
        ids += `event_id=${obj.id}&aware_end_time=${time}`;
        this.dataList[count].muteVisible = false;
      } else {
        // 操作多个
        this.selectedData.forEach((item, index) => {
          if (index === 0) {
            ids += `event_id=${item.id}`;
          } else {
            ids += `&event_id=${item.id}`;
          }
        });
        ids += `&aware_end_time=${time}`;
      }
      const params = {
        param: ids,
        productId: this.filter.productId,
      };
      this.awareEvent(params);
    },
    // 获取时间
    getAwareTime(name) {
      if (name) {
        const now = new Date();
        if (name.indexOf('h') > -1) {
          const hour = parseInt(name.slice(0, name.length - 1), 10);
          now.setHours(now.getHours() + hour);
        } else if (name.indexOf('d') > -1) {
          const day = parseInt(name.slice(0, name.length - 1), 10);
          now.setDate(now.getDate() + day);
        } else if (name.indexOf('w') > -1) {
          const week = parseInt(name.slice(0, name.length - 1), 10);
          now.setDate(now.getDate() + (week * 7));
        }
        const time = bus.timeFormate(now, 'yyyy-MM-dd hh:mm:ss');
        return time;
      }
      return '';
    },
    // 获取持续时间
    getTimeLast(time) {
      const now = new Date();
      const end = new Date(time);
      const num = end.getTime() - now.getTime();
      if (num > 0) {
        const seconds = Math.ceil(num / 1000);
        if (seconds >= 60) {
          // const minutes = Math.floor(seconds / 60);
          const minutes = seconds / 60;
          if (minutes >= 60) {
            const hours = minutes / 60;
            if (hours >= 24) {
              const days = hours / 24;
              return `${Math.floor(days)}天${Math.floor(hours) % 24}小时
              ${Math.floor(minutes) % 60}分${seconds % 60}秒`;
            }
            return `${Math.floor(hours) % 24}小时
              ${Math.floor(minutes) % 60}分${seconds % 60}秒`;
          }
          return `${Math.floor(minutes) % 60}分${seconds % 60}秒`;
        }
        return `${seconds % 60}秒`;
      }
      return time;
    },
  },
  mounted() {
    this.judge();
  },
};

</script>
