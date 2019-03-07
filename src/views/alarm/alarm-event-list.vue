'<style lang="scss">
@import './alarm-event-list.scss';

</style>
<template>
  <div class="main-container alarm-event">
    <div class="main-list-content">
      <div class="common-detail-top clearfix mb-10">
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
      <div class="table-list event-list">
        <div class="box-content">
          <paging ref="eventList" :total="total" @on-page-info-change="pageInfoChange" :pageSize="filter.page_size">
            <Table size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              :row-class-name="rowClassName"
              :loading="loading"
              no-data-text="暂无数据"
              @on-select-all="selectAll"
              @on-selection-change="selectItem"
              @on-sort-change="handleSort"
              ></Table>
          </paging>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import core from '../../mixins/core';
import bus from '../../libs/bus';
import { getEvents, awareEvent } from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'alarmEvent',
  mixins: [core],
  components: {
    paging,
  },
  data() {
    return {
      loading: false,
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
      selectedData: [], // 选中数据
      editPluginInfo: {}, // 正在编辑插件信息
      pluginId: '',
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '规则名称',
          key: 'strategy_name',
          sortable: 'custom',
          minWidth: 150,
          render: (h, params) => h('span', {
            class: {
              'view-detail': true,
            },
            attrs: {
              title: '查看告警',
            },
            on: {
              click: () => {
                this.viewDetail(params.row);
              },
            },
          }, params.row.strategy_name),
        }, {
          title: '告警设备',
          key: 'host_name',
          sortable: 'custom',
          minWidth: 140,
        }, {
          title: 'IP地址',
          key: 'ip',
          sortable: 'custom',
          width: 130,
        }, {
          title: '报警次数',
          key: 'count',
          sortable: 'custom',
          width: 100,
          render: (h, params) => h('span', `${params.row.count}/${params.row.alarm_count}`),
        }, {
          title: '状态',
          key: 'status',
          sortable: 'custom',
          width: 100,
          render: (h, params) => h('div', [h('Badge', {
            class: {
              'alert-count': params.row.status === 1,
              'unknow-count': params.row.status === 2,
              'ok-count': params.row.status === 3,
            },
            props: {
              count: this.getStatusCount(params.row.status),
            },
          })]),
        }, {
          title: '最近更新时间',
          key: 'update_time',
          sortable: 'custom',
          width: 150,
        }, {
          title: '报警知悉过期时间',
          key: 'aware_end_time',
          sortable: 'custom',
          width: 170,
          render: (h, params) => h('span', this.getTimeLast(params.row.aware_end_time, params.row.status)),
        }, {
          title: '操作',
          align: 'right',
          width: 140,
          render: (h, params) => h('div', [h('Poptip', {
            props: {
              placement: 'left',
              // value: params.row.muteVisible,
              trigger: 'hover',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'android-volume-up',
            },
            // nativeOn: {
            //   click: (event) => {
            //     event.stopPropagation();
            //     this.showMute(params.index);
            //   },
            // },
          }), h('div', {
            slot: 'content',
          }, [h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1h', params.row, params.index);
              },
            },
          }, '1h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('4h', params.row, params.index);
              },
            },
          }, '4h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('8h', params.row, params.index);
              },
            },
          }, '8h'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1d', params.row, params.index);
              },
            },
          }, '1天'), h('Button', {
            on: {
              click: (event) => {
                event.stopPropagation();
                this.awareData('1w', params.row, params.index);
              },
            },
          }, '1周')])])]),
        },
      ],
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
      this.$router.push({
        path: `/alarm/event/detail/${item.id}/${this.filter.productId}`,
        query: {
          product: this.$route.query.product,
          eventname: item.strategy_name,
        },
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.filter.query = this.searchName.trim();
      this.initFilter();
    }, 300), // 搜索
    removeData() {}, // 删除
    reload() {
      // this.filter.page = 1;
      this.getData(this.filter);
    }, // 刷新
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
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
    rowClassName(item) {
      return item.enable === 0 ? 'show-ivu-row disabled' : 'show-ivu-row';
    },
    // 翻页
    pageInfoChange(filter) {
      // this.setInitPage(filter.pageSize);
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      this.getData(this.filter);
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.eventList.init();
      this.filter.page = 1;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      this.loading = true;
      const param = Object.assign({}, params);
      if (param.query === '') delete param.query;
      if (param.order === '') delete param.order;
      getEvents(param).then((res) => {
        if (res.status === 200) {
          this.selectedData = [];
          this.total = res.data.total;
          this.dataList = res.data.events.map((item) => {
            const obj = item;
            obj.muteVisible = false;
            return obj;
          });
        }
        this.loading = false;
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
        if (obj.status === 3) {
          this.$Modal.warning({
            title: '知悉结果',
            content: `主机${obj.host_name},策略${obj.strategy_name}的告警已经恢复,无需知悉`,
          });
        } else {
          const params = {
            param: ids,
            productId: this.filter.productId,
          };
          this.awareEvent(params);
        }
      } else {
        // 操作多个
        const awareArr = []; // 需要知悉的
        const awaredArr = []; // 已恢复的
        let awareable = true; // 可以直接前去知悉
        this.selectedData.forEach((item) => {
          if (item.status === 3) {
            awaredArr.push(item.host_name);
            awareable = false;
          } else {
            awareArr.push(`event_id=${item.id}`);
          }
        });
        ids += `${awareArr.join('&')}&aware_end_time=${time}`;
        const params = {
          param: ids,
          productId: this.filter.productId,
        };
        if (awareArr.length) {
          if (awareable) {
            this.awareEvent(params);
          } else {
            this.$Modal.confirm({
              title: '知悉确认',
              content: `主机 ${awaredArr.join(', ')} 
              的告警已经恢复,确认将知悉其他${awareArr.length}台主机的告警`,
              onOk: () => {
                this.awareEvent(params);
              },
            });
          }
        } else {
          this.$Modal.warning({
            title: '知悉结果',
            content: '选中的告警均已经恢复,无需进行知悉操作',
          });
        }
      }
    },
    getStatusCount(arg) {
      const status = parseInt(arg, 10);
      if (status === 1) {
        return '活跃';
      } else if (status === 2) {
        return '知悉';
      } else if (status === 3) {
        return '恢复';
      }
      return '';
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
    getTimeLast(time, status) {
      if (status !== 2) return '--';
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
  created() {
  },
  mounted() {
    this.judge();
  },
};

</script>
