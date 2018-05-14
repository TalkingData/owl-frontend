<style lang="scss">
@import './queue-list.scss'

</style>
<template>
  <div class="queue-list">
    <div class="clearfix mb-10">
      <div class="float-left">
      </div>
      <div class="float-right">
        <Input style="width:200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </div>
    <div class="table-list">
      <div class="box-content">
        <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
          <Table slot="listTable" size="small" border
            ref="tablelist"
            :data="dataList" 
            :columns="columns"
            :row-class-name="rowClassName"
            no-data-text="暂无数据"
            ></Table>
            <!-- @on-select-all="selectAll"
            @on-selection-change="selectItem"
            @on-sort-change="handleSort" -->
        </paging>
      </div>
    </div>
    <Modal :title="modalTitle" v-model="queueModal">
      <Alert type="warning" show-icon>确定要{{actionWord}}：<span v-for="(item,index) in deleteShowData" :key="item.id"><span v-if="index">，</span>{{item.name}}</span>&nbsp;吗？</Alert>
      <div slot="footer">
        <Button @click="confirm" type="primary">确定</Button>
        <Button @click="cancel">取消</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getQuequeStatus, updateQueue } from '../../../models/service';
import paging from '../../page/paging';

export default {
  name: 'queueList',
  components: {
    paging,
  },
  props: {},
  data() {
    return {
      saveDataList: [], // 作为备份的数据列表
      // 过滤器
      filter: {
        page_size: 10,
        page: 1,
      },
      searchName: '',
      total: 10,
      allDataList: [],
      dataList: [], // 列表
      selectedData: [], // 选中数据
      queueModal: false,
      deleteShowData: [],
      queueInfo: {}, // 操作队列信息
      actionName: '', // 操作名称
      columns: [
        {
          title: '队列名称',
          key: 'name',
        }, {
          title: 'count',
          key: 'count',
        }, {
          title: '操作',
          align: 'right',
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: params.row.mute ? '开启' : '关闭',
              placement: 'top',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: params.row.mute ? 'android-volume-up' : 'android-volume-off',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.muteTrigger(params.row, params.index);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '清空队列',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'trash-b',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.removeData(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  methods: {
    // 选择队列
    userSelect(arr) {
      this.selectedData = arr;
    },
    // 获取数据// 获取组下队列列表
    getData() {
      getQuequeStatus().then((res) => {
        if (res.status === 200) {
          // this.total = res.data.queues.length;
          this.saveDataList = res.data.queues;
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              return obj.name.toLowerCase().indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = res.data.queues;
          }
          this.total = this.allDataList.length;
          const start = (this.filter.page - 1) * this.filter.page_size;
          const end = this.filter.page * this.filter.page_size;
          this.dataList = this.allDataList.slice(start, end);
          // this.dataList = this.allDataList.slice(0, this.filter.page_size);
        } else {
          this.total = 0;
          this.dataList = [];
          this.allDataList = [];
          this.saveDataList = [];
        }
      });
    },
    // 操作队列
    updateQueue(name) {
      updateQueue({
        id: this.queueInfo.id,
        action: name,
      }).then((res) => {
        if (res.status === 200) {
          this.$Message.success(`${this.actionWord}成功`);
          this.getData();
        } else {
          this.$Message.warning(`${this.actionWord}失败`);
        }
        this.cancel();
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
      this.initFilter();
      this.filter.query = this.searchName;
      if (this.searchName !== '') {
        this.allDataList = this.saveDataList.filter((item) => {
          const obj = item;
          return obj.name.toLowerCase().indexOf(this.searchName) > -1;
        });
      } else {
        this.allDataList = this.saveDataList;
      }
      this.total = this.allDataList.length;
      this.dataList = this.allDataList.slice(0, this.filter.page_size);
    }, 300),
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
    },
    reload() {
      this.getData();
    },
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      // this.getData(this.filter);
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 清空队列
    removeData(obj) {
      if (obj === 'multiple') { // 移除多个
        this.deleteShowData = this.selectedData.map((item) => {
          const host = Object.assign({}, item);
          return host;
        });
      } else { // 移除一个
        this.deleteShowData = [obj];
        this.queueInfo = obj;
        this.actionName = 'clean'; // 操作名称
      }
      this.queueModal = true;
    },
    // 设置队列
    muteTrigger(obj) {
      this.queueInfo = obj;
      this.deleteShowData = [obj];
      this.actionName = obj.mute ? 'unmute' : 'mute';
      // false时,操作开启,true时,操作关闭
      this.queueModal = true;
    },
    // 删除队列确认
    confirm() {
      if (this.deleteShowData.length) {
        this.updateQueue(this.actionName);
      }
    },
    // 取消删除
    cancel() {
      this.queueModal = false;
      this.deleteShowData = [];
    },
    rowClassName(item) {
      return item.mute ? 'show-ivu-row disabled' : 'show-ivu-row';
    },
  },
  computed: {
    modalTitle() {
      return this.actionWord;
    },
    // 告警文字
    actionWord() {
      let word = '';
      if (this.actionName === 'mute') {
        word = '关闭告警';
      } else if (this.actionName === 'unmute') {
        word = '开启告警';
      } else if (this.actionName === 'clean') {
        word = '清空队列';
      }
      return word;
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
  mounted() {
    this.getData();
  },
  beforeDestroy() {
  },
};

</script>
