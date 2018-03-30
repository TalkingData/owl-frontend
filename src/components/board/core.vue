<style lang="scss">
  @import './core.scss'
</style>
<template>
  <div class="core-view">
    <div class="top clearfix">
      <slot>我的看板</slot>
      <Input style="width: 100px;" @on-change="search" v-model="searchData" placeholder="检索..."></Input>
      <!-- <input @keyup="search(searchData)" v-model="searchData" type="search" placeholder="检索..."> -->
    </div>
    <div class="core-body">
      <div v-for="(item, index) in data" class="body-item clearfix" :key="item.id">
        <div class="body-item-l">
          <span @click='add(item.id)'>{{item.name}}</span>
        </div>
        <div class="body-item-r">
          <Button style="color:#2d8cf0;" type="text" icon="compose" @click="edit(item)"></Button>
          <Button style="color:#2d8cf0;"  type="text" icon="trash-a" @click="del(item, index)"></Button>
          <!-- <span class="icon-left-edit" @click="edit(item)"></span> -->
          <!-- 隐藏分享按钮 -->
          <!-- <span class="icon-share"></span> -->
          <!-- <span @click="del(item.id, index)" class="icon-left-trash"></span> -->
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { getPanels, getAllCharts, deleteCharts, deletePanels, addPanelToFavor } from '../../models/service';

export default {
  name: 'Core',
  props: {
    type: {
      type: String,
      default: 'board',
    },
  },
  components: {},
  data() {
    return {
      data: [],
      searchData: '',
      favor: [],
    };
  },
  methods: {
    // 搜索
    // eslint-disable-next-line
    search: _.debounce(function(obj) {
      if (this.type === 'board') {
        getPanels({
          q: obj,
        }).then((response) => {
          this.data = response.data.panels;
        });
      } else if (this.type === 'chart') {
        getAllCharts({
          q: obj,
        }).then((response) => {
          this.data = response.data.charts;
        });
      }
    }, 500),
    edit(obj) {
      if (this.type === 'board') {
        localStorage.setItem('panel', JSON.stringify(obj));
        // PANEL.panel.data=obj;---刷新浏览器后该变量会被清空，所以采用localStorage方法
        this.$router.push({ path: `/createboard/${obj.id}` });
      } else if (this.type === 'chart') {
        // 弹出编辑图表信息的弹窗 edit_data
        this.$emit('edit-data', obj.id);
      }
    },
    del(item, index) {
      const self = this;
      if (this.type === 'board') {
        this.$Modal.confirm({
          title: '删除',
          content: `确定删除看板${item.name}吗`,
          onOk: () => {
            self.delGoc(item.id, index);
          },
        });
      } else if (this.type === 'chart') {
        this.$Modal.confirm({
          title: '删除',
          content: `确定删除图表${item.name}吗`,
          onOk: () => {
            self.delGoc(item.id, index);
          },
        });
      }
    },
    delGoc(id, index) {
      if (this.type === 'board') {
        deletePanels({
          panelId: id,
        }).then((res) => {
          if (res.status === 200) {
            this.data.splice(index, 1);
            // 删除操作，若该看板位于favor视窗，需删除
            bus.$emit('reload_favor', id);
          }
        });
      } else if (this.type === 'chart') {
        deleteCharts({
          chartId: id,
        }).then((res) => {
          if (res.status === 200) {
            this.data.splice(index, 1);
            // 删除操作，若该图表属于该看板视窗，需删除与看板的关联，并且另该chart display=none
            this.$emit('on-delete-chart', id); // remove_chart
          }
        });
      }
    },
    // 获取已展示看板或已存在图表信息
    getFavor() {
      if (this.type === 'board') {
        this.favor = [];
        getPanels({
          favor: 1,
        }).then((response) => {
          const panel = response.data.panels;
          for (let i = 0; i < panel.length; i += 1) {
            this.favor.push(panel[i].id);
          }
        });
      }
    },
    // 查看看板
    add(id) {
      if (this.type === 'board') {
        // 添加到展示看板栏、关闭添加看板弹窗、获取当前看板图表数据并展示
        if (this.favor.indexOf(id) !== -1) {
          this.$Message.warning('看板已存在');
        } else if (this.favor.length === 4) {
          this.$Message.warning('可展示看板数量不能超过四个！');
        } else {
          addPanelToFavor({
            panelId: id,
          }).then((response) => {
            this.getFavor();
            bus.$emit('set_favor', response.data.panel);
          });
        }
      }
    },
  },
  computed: {},
  watch: {},
  mounted() {
    this.$on('chartData', (data) => {
      this.data = data;
      if (this.type === 'board') {
        this.getFavor();
      }
    });
    this.$on('clearData', () => {
      this.searchData = '';
    });
    bus.$on('refreshFavor', (favor) => {
      for (let i = 0; i < favor.length; i += 1) {
        this.favor.push(favor[i].id);
      }
    });
  },
  beforeDestroy() {},
};

</script>
