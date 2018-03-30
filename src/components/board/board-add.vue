<style lang="scss">
  @import './board-add.scss'
</style>
<template>
  <div class="board-add">
    <Modal width="830" class="board-add" :title="boardTitle" v-model="boardModal">
      <div class="search-board">
        <Input style="width:200px" v-model="searchName" @on-change="search" placeholder="输入检索词"></Input>
      </div>
      <div class="board-body scroll">
        <div v-show="isBoard" @click="create('board')" class="check-board create"></div>
        <div v-show="isChart" @click="create('chart')" class="check-board create"></div>
        <div v-if="isBoard" v-for="item in panels" @click="showBoard(item.id)" :key="item.id" class="check-board board">
          <h1>{{item.name}}</h1>
          <div class="img">
            <img v-if="item.charts.length > 0 && item.charts[0].thumbnail" class='sample' :src="item.charts[0].thumbnail">
            <img v-else class='thumbnail' src="../../assets/image/img.png">
          </div>
          <div class="info">
            <p>
              <i>最近更新</i>
              <span>{{item.update_at}}</span>
            </p>
            <p class="bg">包含图表: <b>{{item.charts.length}}</b></p>
          </div>
        </div>
        <!--图表-->
        <div v-if="isChart" v-for="item in charts" @click="addChart(item)" :key="item.id" class="check-board chart">
            <h1>{{item.name}}</h1>
            <div class="img">
              <img class='thumbnail' v-if='item.thumbnail' :src="item.thumbnail">
              <img v-else src="../../assets/image/img.png" class='sample'>
            </div>
            <div class="info">
              <p>
                <i>最近更新</i>
                <span>{{item.update_at}}</span>
              </p>
              <p class="bg">看板引用: <b>{{item.refer_count}}</b></p>
            </div>
        </div>
      </div>
      <Page style="margin-top:10px;"
      :total="pageInfo.total" 
      :current="pageInfo.page"
      :page-size="pageInfo.pageSize"
      :page-size-opts="pageInfo.pageSizeOpts"
      @on-change="pageChange"
      @on-page-size-change="pageSizeChange" size="small" show-elevator show-sizer></Page>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { getPanels, getAllCharts, addPanelToFavor } from '../../models/service';

export default {
  name: 'boardAdd',
  props: {
    // chartId: {
    //   type: String,
    //   default: 'listId',
    // },
  },
  components: {},
  data() {
    return {
      boardTitle: '',
      boardModal: false,
      pageInfo: {
        page: 1,
        pageSize: 5,
        total: 0,
        pageSizeOpts: [5, 10, 20, 30, 40],
      },
      searchName: '', // 搜索
      favor: [], // 当前主控板上的看板
      panels: [], // 所有看板
      charts: [], // 图表列表
      isBoard: false,
      isChart: false,
    };
  },
  methods: {
    create(str) {
      this.boardModal = false;
      if (str === 'board') {
        this.$router.push({ path: '/createboard/create' });
      } else if (str === 'chart') {
        // create-board, set-board
        bus.$emit('create_data');
      }
    },
    // 查看看板,将当前看板添加到favor中
    showBoard(id) {
      // 添加到展示看板栏、关闭添加看板弹窗、获取当前看板图表数据并展示
      if (this.favor.indexOf(id) !== -1) {
        this.$Message.warning('看板已存在');
      } else {
        addPanelToFavor({
          panelId: id,
        }).then((res) => {
          if (res.status === 200) {
            // 触犯主控板展示
            bus.$emit('set_favor', res.data.panel);
          }
        });
        // 关闭当前弹出框
        bus.$emit('add_close');
        this.boardModal = false;
      }
    },
    // 添加图表
    addChart(obj) {
      // 将图表添加到当前看板中、显示为编辑状态,并关闭该board窗口
      this.boardModal = false;
      // 触发create-board中添加图表事件
      bus.$emit('create_relate', obj);
    },
    pageChange(current) {
      this.pageInfo.page = current;
      if (this.isChart) {
        this.getAllCharts(this.pageInfo);
      }
      if (this.isBoard) {
        this.getPanels(this.pageInfo);
      }
    },
    pageSizeChange(pageSize) {
      this.pageInfo.page = 1;
      this.pageInfo.pageSize = pageSize;
      // this.getPanels(this.pageInfo);
      if (this.isChart) {
        this.getAllCharts(this.pageInfo);
      }
      if (this.isBoard) {
        this.getPanels(this.pageInfo);
      }
    },
    // eslint-disable-next-line
    search: _.debounce(function () {
      if (this.isBoard) {
        if (this.searchName) {
          getPanels({
            q: this.searchName,
          }).then((res) => {
            if (res.status === 200 && res.data.code === 200) {
              this.set_panels(res.data);
            }
          });
        } else {
          this.getPanels(this.pageInfo);
        }
      } else if (this.isChart) {
        if (this.searchName) {
          getAllCharts({
            q: this.searchName,
          }).then((res) => {
            if (res.status === 200 && res.data.code === 200) {
              this.set_charts(res.data);
            }
          });
        } else {
          this.getAllCharts(this.pageInfo);
        }
      }
    }, 500),
    // 获取全部看板
    getPanels(info) {
      getPanels({
        page: info.page,
        pageSize: info.pageSize,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          // this.pageInfo.total = res.data.total;
          this.getFavor();
          this.set_panels(res.data);
        }
      });
    },
    // 设置显示的看板时间
    set_panels(obj) {
      this.panels = obj.panels;
      this.pageInfo.total = obj.total;
      this.panels.forEach((item) => {
        const pItem = item;
        pItem.update_at = this.getTimeDuration(pItem.update_at);
      });
    },
    getAllCharts(info) {
      getAllCharts({
        page: info.page,
        pageSize: info.pageSize,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.set_charts(res.data);
        }
      });
    },
    // 设置显示的图表
    set_charts(obj) {
      this.charts = obj.charts;
      this.pageInfo.total = obj.total;
      this.charts.forEach((item) => {
        const cItem = item;
        cItem.update_at = this.getTimeDuration(cItem.update_at);
      });
    },
    // 获取已经展示的看板,展示在主控台的看板
    getFavor() {
      getPanels({
        favor: 1,
      }).then((res) => {
        if (res.status === 200) {
          const favorArr = res.data.panels.map(item => item.id);
          this.favor = favorArr;
        }
      });
    },
    // 获取最近时间
    getTimeDuration(time) {
      if (time) {
        const now = new Date().getTime();
        const day = (now - Date.parse(time)) / 86400 / 1000;
        if (day < 1) {
          if (parseInt(day * 24, 10) < 1) {
            return `${parseInt(day * 24 * 60, 10)}分钟前`;
          }
          return `${parseInt(day * 24, 10)}小时前`;
        }
        return `${parseInt(day, 10)}天前`;
      }
      return time;
    },
  },
  computed: {},
  watch: {},
  mounted() {
    this.$on('on-add-board', (str) => {
      this.boardModal = true;
      if (str === 'board') {
        this.boardTitle = '添加看板';
        this.isBoard = true;
        this.isChart = false;
        this.getPanels(this.pageInfo);
      } else if (str === 'chart') {
        this.boardTitle = '添加图表';
        this.isBoard = false;
        this.isChart = true;
        this.getAllCharts(this.pageInfo);
      }
    });
    bus.$on('back-to-add-chart', () => {
      this.boardModal = true;
      this.boardTitle = '添加图表';
      this.isBoard = false;
      this.isChart = true;
      this.getAllCharts(this.pageInfo);
    });
  },
  beforeDestroy() {},
};

</script>
