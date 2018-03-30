<style lang="scss">
  @import './plugin-list.scss'
</style>
<template>
  <div class="box plugin-list">
    <div class="box-header t-fixed">
      <span class="box-header-title">插件列表</span>
      <Button @click="removeData" :disabled="!disableObj.isRemove" type="primary">删除</Button>
      <Button @click="correlate" :disabled="!disableObj.isCorrelate" type="primary">关联</Button>
      <div class="box-header-tool">
        <Input style="width:200px;" v-model="searchName" @on-change="search()" placeholder="输入关键字检索"></Input>
        <Button @click="reload">
          <Icon size="18" type="refresh"></Icon>
        </Button>
      </div>
    </div>
    <div class="box-content">
      <div class="box-content-title">
        <Row>
          <Col class="title-tr" span="4">
            <Checkbox v-model="checkAll" @on-change="selectAll"></Checkbox>插件名
          </Col>
          <Col class="title-tr" span="4">执行参数</Col>
          <Col class="title-tr" span="4">执行间隔(秒)</Col>
          <Col class="title-tr" span="4">超时时间(秒)</Col>
          <Col class="title-tr" span="4">关联主机</Col>
          <Col class="title-tr" span="4">操作</Col>
        </Row>
      </div>
      <div class="box-content-add">
        <div v-show="!isAddStatus"  @click="addData" class="box-content-add-btn">
          <Icon type="plus-round"></Icon>
        </div>
      </div>
      <div class="box-content-body">
        <Row class="box-content-item" v-for="(item, index) in dataList" :key="index">
          <div v-if="item.id !== pluginId">
            <Col class="body-td" span="4">
              <Checkbox v-model="item.checked" @on-change="selectItem(item)"></Checkbox><span>{{item.name || '--'}}</span>
            </Col>
            <Col class="body-td" span="4" :title="item.args">{{item.args || '--'}}</Col>
            <Col class="body-td" span="4">{{item.interval || '--'}}</Col>
            <Col class="body-td" span="4">{{item.timeout || '--'}}</Col>
            <Col class="body-td" span="4">
              <Button type="primary" v-if="item.hosts.length > 0">查看</Button>
              <Button type="primary" v-else>添加</Button>
            </Col>
            <Col class="body-td" span="4"><Button type="primary" @click="editShow(item)">编辑</Button></Col>
          </div>
          <div v-else>
            <Col class="body-td" span="4">
              <Checkbox v-model="item.checked" @on-change="selectItem(item)"></Checkbox>
              <Input style="width: auto;" v-model="editPluginInfo.name"></Input>
            </Col>
            <Col class="body-td" span="4" :title="item.args"><Input v-model="editPluginInfo.args"></Input></Col>
            <Col class="body-td" span="4"><Input v-model="editPluginInfo.interval"></Input></Col>
            <Col class="body-td" span="4"><Input v-model="editPluginInfo.timeout"></Input></Col>
            <Col class="body-td" span="4"><Button type="primary">编辑</Button></Col>
            <Col class="body-td" span="4">
              <Button type="primary" @click="editSave">保存</Button>
              <Button @click="etidCancel">取消</Button>
            </Col>
          </div>
        </Row>
      </div>
      <div class="footer">
        <div class="common-float-left">
          <Select style="width: 100px;" v-model="filter.pageSize" @on-change="pageSizeChange">
            <Option v-for="item in pageArr" :label="item + '条每页'" :value="item" :key="item">{{item}}条每页</Option>
          </Select>
        </div>
        <div class="common-float-right">
          <Page :total="total" show-total :page-size="filter.pageSize" :current.sync="filter.page" @on-change="pageChange"></Page>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
import { getPlugins, editPlugin } from '../../models/service';

export default {
  name: 'pluginList',
  components: {},
  props: {},
  data() {
    return {
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      isAddStatus: false, // 是否是添加模式
      filter: { // 翻页
        page: 1,
        pageSize: 10,
      },
      pageArr: [10, 50, 100, 200, 500], // 页数
      total: 0,
      checkAll: false, // 全选
      selectedData: [], // 选中数据
      editPluginInfo: {}, // 正在编辑插件信息
      pluginId: '',
    };
  },
  methods: {
    search() {}, // 搜索
    removeData() {}, // 删除
    correlate() {}, // 关联
    reload() {}, // 刷新
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
    selectItem() {
      this.selectedData = this.dataList.filter(plugin => plugin.checked);
      this.checkAll = this.selectedData.length === this.dataList.length;
    },
    // 添加数据
    addData() {
      this.isAddStatus = !this.isAddStatus;
    },
    // 页数修改
    pageSizeChange(size) {
      this.filter.page = 1;
      this.filter.pageSize = size;
      this.getData(this.filter);
    },
    // 翻页
    pageChange(current) {
      this.filter.page = current;
      this.getData(this.filter);
    },
    // 获取数据
    getData(params) {
      getPlugins(params).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.dataList = res.data.plugins.map((item) => {
            const obj = item;
            obj.checked = false;
            return obj;
          });
        }
      });
    },
    // 开始编辑
    editShow(plugin) {
      this.editPluginInfo = JSON.parse(JSON.stringify(plugin));
      this.pluginId = plugin.id;
    },
    // 取消编辑
    etidCancel() {
      this.pluginId = '';
    },
    editSave() {
      this.pluginId = '';
    },
    // 编辑插件
    editPlugin(params) {
      editPlugin(params);
    },
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
  },
  mounted() {
    this.getData(this.filter);
  },
  beforeDestroy() {},
};

</script>
