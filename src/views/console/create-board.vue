<style lang="scss">
  @import './create-board.scss'
</style>
<template>
  <div class="create-board">
    <div class="set-body">
      <div :class="[isShow ? 'fixedIcon box' : 'fixedIcon']">
        <span class="icon" @click="showBox"></span>
        <div class="showBox">
          <Core @on-delete-chart="remove_chart" @edit-data="edit_data" ref="coreRight" type="chart">我的图表</Core>
        </div>
      </div>
      <div class="set-head">
        <div class="left-column">
          <Button class="back" @click="backConsole" icon="chevron-left"></Button>
        </div>
        <div class="right-column">
          <Button type="success" @click="savepanels">保存看板</Button>
          <Button @click="backConsole">取消</Button>
        </div>
        <div class="center-column">
          <div class="sub-right">
            <Button type="primary" icon="stats-bars" @click="createChart">添加图表</Button>
          </div>
          <div class="sub-center">
            <Input placeholder="看板名称" v-model="newPanel.name"></Input>
          </div>
        </div>
      </div>
      <!-- 展示图表区域 -->
      <div v-for="(item, index) in charts" class="chartBox" :key="item">
        <editChartMove @on-remove-chart="remove_chart" ref="editChart" :editChartId="'editChartId' + index"></editChartMove>
      </div>
    </div>
    <div class="add-components">
      <!--添加、创建图表 board-->
      <board-add ref="addBoardModal"></board-add>
      <!--编辑图表信息，添加图表 chartdata-->
      <chartAdd ref="addChartModal"></chartAdd>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import bus from '../../libs/bus';
import { getQueryChart, addPanels, updatePanels, addPanelToFavor,
 getAllCharts, getPanelCharts, getChartInfo } from '../../models/service';
import boardAdd from '../../components/board/board-add';
import chartAdd from '../../components/board/chart-add';
import editChartMove from '../../components/console/edit-chart-move';
import Core from '../../components/board/core';

export default {
  name: 'createBoard',
  props: {
    // chartId: {
    //   type: String,
    //   default: 'listId',
    // },
  },
  components: {
    boardAdd,
    chartAdd,
    editChartMove,
    Core,
  },
  data() {
    return {
      // 展示侧边栏
      isShow: false,
      // 新建看板信息
      newPanel: {
        name: '',
        charts: [],
      },
      charts: [],
      panelId: 0,
    };
  },
  computed: {},
  watch: {},
  mounted() {
    if (this.$route.params.panelId === 'create') {
      this.$refs.addBoardModal.$emit('on-add-board', 'chart');
    } else {
      // this.panelId = this.$route.params.panelId;
      const value = JSON.parse(localStorage.getItem('panel'));
      this.getData(value);
    }
    // 新建图表,获取chartID
    bus.$on('chart_id', (obj) => {
      this.newPanel.charts.push({ id: obj.id });
      this.charts.push(obj.id);
      // this.render_chart(obj, this.charts.length - 1);
    });
    // 更新已有图表成功后更新数据
    bus.$on('update_relate', (obj) => {
      this.judge_iner(obj);
    });
    // 添加图表到board中
    bus.$on('create_relate', (obj) => {
      this.judge_chart(obj);
    });
    // 编辑图表
    bus.$on('on-edit-chart-move', (id) => {
      this.edit_data(id);
    });
    // 刷新图表信息
    bus.$on('update_data', (id) => {
      // this.getTimeScope(1);
      // 获取该id下chart的相关信息
      getChartInfo({
        chartId: id,
      }).then((response) => {
        if (response.data.code === 200) {
          this.judge_iner(response.data.chart);
        } else {
          this.$Message.warning(response.data.message);
        }
      });
    });
  },
  beforeDestroy() {
    bus.$off('chart_id');
    bus.$off('update_relate');
    bus.$off('create_relate');
    bus.$off('on-edit-chart-move');
    bus.$off('update_data');
  },
  methods: {
    // 设置图表的宽度
    set_size(size, pos) {
      this.$nextTick(() => {
        const chartBox = document.getElementsByClassName('chartBox');
        chartBox[pos].style.width = `${25 * size}%`;
      });
    },
    // 数据预加载
    getData(data) {
      this.panelId = data.id;
      this.newPanel.id = data.id;
      this.newPanel.name = data.name;
      getPanelCharts({
        panelId: this.panelId,
      }).then((response) => {
        const chart = response.data.charts;
        const len = chart.length;
        for (let y = 0; y < len; y += 1) {
          const tmp = chart[y];
          this.newPanel.charts.push({ id: tmp.id });
          this.charts.push(tmp.id);
          this.render_chart(tmp, y);
        }
      });
    },
    // 添加图表
    createChart() {
      this.$refs.addBoardModal.$emit('on-add-board', 'chart');
    },
    // 侧边栏
    showBox() {
      if (this.isShow) {
        this.isShow = false;
      } else {
        getAllCharts().then((response) => {
          this.$refs.coreRight.$emit('chartData', response.data.charts);
        });
        this.isShow = true;
      }
    },
    // 返回主控板
    backConsole() {
      this.$router.push({ path: '/console' });
    },
    // 保存看板
    savepanels() {
      // 创建看板
      if (this.$route.params.panelId === 'create') {
        if (this.newPanel.name) {
          addPanels(this.newPanel).then((res) => {
            if (res.data.code === 200) {
              const id = res.data.panel.id;
              addPanelToFavor({
                panelId: id,
              }).then((response) => {
                if (response.status === 200) {
                  this.$router.push({ path: '/console' });
                }
              });
            } else {
              this.$Message.warning(res.data.message);
            }
          });
        } else {
          this.$Message.warning('看板名称不能为空');
        }
      } else {
        // 更新看板
        this.updatePanels();
      }
    },
    // 更新看板
    updatePanels() {
      if (this.newPanel.name) {
        updatePanels(this.newPanel).then((res) => {
          if (res.data.code === 200) {
            this.$router.push({ path: '/console' });
          } else {
            this.$Message.warning(res.data.message);
          }
        });
      } else {
        this.$Message.warning('看板名称不能为空');
      }
    },
    // 判断该看板是否已有该charts
    judge_chart(obj) {
      const arr = this.newPanel.charts.filter(item => item.id === obj.id);
      if (arr.length === 0) {
        this.newPanel.charts.push({ id: obj.id });
        this.charts.push(obj.id);
        this.render_chart(obj, this.charts.length - 1);
      }
    },
    // 判断是否是“我的图表块的编辑”
    judge_iner(obj) {
      const len = this.charts.length;
      for (let i = 0; i < len; i += 1) {
        const tmp = this.charts[i];
        if (tmp === obj.id) {
          this.render_chart(obj, i);
          return;
        }
      }
    },
    // 动态查询数据并发送给echart组件,pos用于标识渲染的echart位置
    render_chart(obj, pos) {
      this.set_size(obj.size, pos);
      const len = obj.elements.length;
      if (len === 0) {
        this.$nextTick(() => {
          this.$broadcast('render_null', pos);
          this.$refs.editChart[pos].$emit('null_data', obj.id, obj);
        });
      } else {
        this.$nextTick(() => {
          this.$refs.editChart[pos].$emit('init_data', pos);
          const axiosArr = obj.elements.map((unit) => {
            const filterItem = unit;
            return getQueryChart({
              metric: filterItem.metric,
              tags: filterItem.tags,
              start: bus.selectDate[0].replace(/-/g, '/'),
              end: bus.selectDate[1].replace(/-/g, '/'),
            });
          });
          axios.all(axiosArr).then((res) => {
            if (res.length > 0) {
              const series = [];
              res.forEach((response) => {
                if (response.data.code === 200) {
                  if (response.data.data) {
                    // 循环处理每个elements下获取的数据列
                    response.data.data.forEach((queryItem) => {
                      const seriesItem = {
                        theData: {
                          name: '',
                          data: [],
                          // type: 'line',
                          visible: true,
                          threshold: null,
                        },
                        metric_name: '',
                      };
                      // 图表中每条线的名字,后半部分
                      let host = `${queryItem.metric}, `;
                      const tagsArr = Object.keys(queryItem.tags);
                      tagsArr.forEach((tag) => {
                        if (tag !== 'uuid') {
                          host += `${tag}=${queryItem.tags[tag]}, `;
                        }
                      });
                      // 图表中每条线的名字,去掉最后的逗号与空格
                      seriesItem.theData.name = host.substring(0, host.length - 2);
                      seriesItem.metric_name = seriesItem.theData.name;
                      // 设置时间-数据格式对
                      const dpsArr = Object.entries(queryItem.dps);
                      seriesItem.theData.data =
                        dpsArr.map(dpsItem => [dpsItem[0] * 1000, dpsItem[1]]);
                      // seriesItem.theData.data = dpsArr;
                      series.push(seriesItem.theData);
                    });
                  } else {
                    this.$refs.editChart[pos].$emit('null_data', obj.id, obj);
                  }
                }
              });
              // chartId, chartData, seriesItem, panelsId, errorMessage,触发图形绘制
              this.$refs.editChart[pos].$emit('set_data', obj.id,
                obj, series, this.panelId, 'errorMessage');
            }
          });
        });
      }
    },
    // 获取移除chart的请求
    remove_chart(id) {
      const len = this.newPanel.charts.length;
      for (let i = 0; i < len; i += 1) {
        const tmp = this.newPanel.charts[i];
        if (tmp.id === id) {
          this.newPanel.charts.splice(i, 1);
          break;
        }
      }
      const len1 = this.charts.length;
      for (let j = 0; j < len1; j += 1) {
        if (this.charts[j] === id) {
          this.charts.splice(j, 1);
          break;
        }
      }
    },
    // 编辑图表信息
    edit_data(id) {
      // 获取该id下chart的相关信息
      getChartInfo({
        chartId: id,
      }).then((response) => {
        if (response.data.code === 200) {
          // 弹出编辑tag的窗口, 在chart-add中展示数据
          this.$refs.addChartModal.$emit('on-edit-chart-data', response.data.chart);
        } else {
          this.$Message.warning(response.data.message);
        }
      });
    },
  },
};

</script>
