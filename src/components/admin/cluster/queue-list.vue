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
        <div class="box-content-title">
          <Row>
            <Col class="title-th" span="10">
            <!-- <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox> -->
            队列名称
            </Col>
            <!-- <Col class="title-th" span="4">ID</Col> -->
            <Col class="title-th" span="6">count</Col>
            <!-- <Col class="title-th" span="3">状态</Col> -->
            <Col class="title-th" span="8"></Col>
          </Row>
        </div>
        <paging :total="total" @on-page-info-change="pageInfoChange" ref="page">
          <div slot="listTable" class="box-content-body" v-if="dataList.length > 0">
            <!-- @click.native="selectItem(item, index)" -->
            <Row class="box-content-item" v-for="(item, index) in dataList" 
            :key="index" 
            :class="[item.mute ? 'disabled' : '']">
              <Col class="body-td hidden-td" span="10">
              <!-- @click.native.stop="selectItem(item, index)" -->
              <!-- <Checkbox v-model="item.checked"></Checkbox> -->
              <span :title="item.name">{{item.name}}</span>
              </Col>
              <!-- <Col class="body-td" span="4">{{item.id}}</Col> -->
              <Col class="body-td" span="6">{{item.count}}</Col>
              <!-- <Col class="body-td" span="3">
                <Badge v-if="item.mute" count="关闭" class="nodata-count"></Badge>
                <Badge v-else count="开启" class="ok-count"></Badge>
              </Col> -->
              <Col class="body-td" span="8">
              <div class="float-right pr-20">
                <Tooltip :content="item.mute ? '开启' : '关闭'" placement="top" class="ml-10">
                  <Icon size="18" :type="item.mute ? 'android-volume-up' : 'android-volume-off'" @click.native.stop="muteTrigger(item, index)"></Icon>
                </Tooltip>
                <Tooltip content="清空队列" placement="top" class="ml-10">
                  <Icon size="18" type="close" @click.native.stop="removeData(item)"></Icon>
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
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      queueModal: false,
      deleteShowData: [],
      queueInfo: {}, // 操作队列信息
      actionName: '', // 操作名称
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
          this.saveDataList = res.data.queues.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              obj.checked = false;
              return obj.name.toLowerCase().indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = res.data.queues.map((item) => {
              const obj = item;
              obj.checked = false;
              return obj;
            });
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
          obj.checked = false;
          return obj.name.toLowerCase().indexOf(this.searchName) > -1;
        });
      } else {
        this.allDataList = this.saveDataList.map((item) => {
          const obj = Object.assign({}, item);
          obj.checked = false;
          return obj;
        });
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
      this.allDataList = this.allDataList.map((item) => {
        const obj = item;
        obj.checked = false;
        return obj;
      });
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
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
