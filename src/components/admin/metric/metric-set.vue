<style lang="scss">
  @import './metric-set.scss'
</style>
<template>
  <div class="metric-set">
    <div class="metric-form">
      <Row class="element-item">
        <chart-tag ref="chartTag" 
        :product-id="productId"
        :metric-list="metricList"
        @on-delete-target="deleteTarget" 
        @on-add-target-success="getTarget"
        @on-change-condition="getCondition"
        ></chart-tag>
      </Row>
      <Row class="pt-5 pb-5">
        <Button type="primary" @click="preview" :disabled="loading">预览图表</Button>
        <Button :disabled="saveDisabled || loading" type="primary" @click="preview('change')">{{chartSwitchWord}}</Button>
        <!-- <Button type="primary" @click="addTarget">添加指标</Button> -->
      </Row>
      <Row class="operate-area">
        <div class="operate-area-title">保存图表到看板:</div>
        <Button :disabled="saveDisabled" type="primary" @click="createNew">创建看板</Button>
        <Button :disabled="saveDisabled" type="primary" @click="selectPanel">选择已有看板</Button>
      </Row>
      <Row class="mt-10">
        <Checkbox :disabled="saveDisabled" v-model="isSave">options</Checkbox>
      </Row>
      <Form :model="chartInfo" ref="chartInfo" v-show="isSave">
        <Row>
          <div class="common-float-left">
            <Form-item :label-width="80" label="图宽" prop="span"
            :rules="{ required: true, type: 'number', message: '请选择图表宽度', trigger: 'change' }">
              <Select style="width:100px;" v-model="chartInfo.span" transfer>
                <Option v-for="item in spanList" :key="item" :label="'span-' + item" :value="item">
                  span-{{item}}
                </Option>
              </Select>
            </Form-item>
          </div>
          <div class="common-float-left">
            <Form-item :label-width="80" label="图高" prop="height"
            :rules="{ required: true, type: 'number', message: '请输入图表高度', trigger: 'change' }">
              <InputNumber :min="10" v-model="chartInfo.height" style="width: 100px" placeholder="请输入图表高度"></InputNumber>px
            </Form-item>
          </div>
        </Row>
        <Row>
          <div class="common-float-left">
            <Form-item :label-width="80" label="类型" prop="type"
              :rules="{ required: true, type: 'number', message: '请选择图表类型', trigger: 'change' }">
              <Select transfer style="width:100px;" v-model="chartInfo.type">
                <Option v-for="item in typeList" 
                  :key="item.id" 
                  :label="item.name" 
                  :value="item.id">
                  {{item.name}}
                </Option>
              </Select>
            </Form-item>
          </div>
        </Row>
      </Form>
    </div>
    <Modal v-model="createModal" :title="createModalTitle">
      <Form :model="chartSaveInfo" ref="chartSaveInfo">
        <Form-item :label-width="80" label="图表名称" prop="title" :rules="{ required: true, type: 'string', message: '请输入图表名称', trigger: 'change' }">
          <Input style="width: 360px;" v-model="chartSaveInfo.title"></Input>
        </Form-item>
        <Form-item v-if="isCreatePanel" :label-width="80" label="看板名称" prop="name" :rules="{ required: true, type: 'string', message: '请输入看板名称', trigger: 'change' }">
          <Input style="width: 360px;" v-model="chartSaveInfo.name"></Input>
        </Form-item>
        <Form-item v-if="!isCreatePanel" :label-width="80" label="选择看板" prop="panelId" :rules="{ required: true, type: 'number', message: '请选择看板', trigger: 'change' }">
          <Select style="width: 360px;" v-model="chartSaveInfo.panelId" filterable>
            <Option v-for="(item, index) in panelList" 
            :key="index"
            :value="item.id"
            :label="item.name">{{item.name}}</Option>
          </Select>
        </Form-item>
      </Form>
      <div slot="footer">
        <Button @click="createModal = false">取消</Button>
        <Button type="primary" @click="createConfirm">保存</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import axios from 'axios';
// import bus from '../../../libs/bus';
import { addCharts, getSuggestMetric, getPanels, addPanels } from '../../../models/service';
import chartTag from './chart-tag';

export default {
  name: 'metricSet',
  props: {
  },
  components: {
    chartTag,
  },
  data() {
    return {
      loading: false, // 加载中
      chartModal: false, // 展示弹出框
      // 新建信息
      chartInfo: {
        title: '', // 名称
        span: 12, // 宽度
        height: 400, // 高度
        type: 1, // 类型
      },
      chartId: 0,
      elements: [1], // 指标部分 tarNum
      elementTarget: {}, // 获取chartTag数据后保存
      // 宽度列表
      spanList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      typeList: [{
        id: 1,
        name: '曲线',
      }, {
        id: 2,
        name: '柱状图',
      }],
      productId: 0,
      panelId: 0,
      metricList: [], // metric列表
      isSave: false, // 是否要保存
      saveDisabled: true, // 不可保存
      createModal: false, // 创建看板panel
      panelList: [],
      // 创建看板信息
      chartSaveInfo: {
        title: '', // 图表名称
        name: '', // panel名称
        panelId: 0, // 选择以后panelId
      }, // 保存看板
      isCreatePanel: false,
      createModalTitle: '',
      chartCount: 'single', // multiple多图,single单图
      metricInfo: {}, // 保存从chartTag中获取的
      createChartList: [], // 创建多个图表的图表信息
      seriesData: [], // 查询图表后生成的series信息,用于生成多个图表时提供图表title
    };
  },
  computed: {
    chartSwitchWord() {
      const word = this.chartCount === 'single' ? '多图展示' : '单图展示';
      return word;
    },
  },
  watch: {},
  methods: {
    // 父级调用保存series,作为多个图表生成title
    setSeries(data) {
      this.seriesData = data;
    },
    // 默认打开
    initOpen() {
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.getSuggestMetric(this.productId);
    },
    // chart-tag中条件更改时,触发不能创建
    getCondition() {
      this.saveDisabled = true;
    },
    // 创建看板
    createNew() {
      this.initSaveInfo();
      this.chartSaveInfo.title = this.metricInfo.metric; // 图表名称默认使用metric
      this.isCreatePanel = true; // 创建看板
      this.createModalTitle = '创建看板并添加图表';
      this.createModal = true;
    },
    // 选择看板
    selectPanel() {
      this.initSaveInfo();
      this.chartSaveInfo.title = this.metricInfo.metric; // 图表名称默认使用metric
      this.isCreatePanel = false; // 选择看板
      this.createModalTitle = '选择看板并添加图表';
      this.createModal = true;
      this.getPanels({
        productId: this.productId,
      });
    },
    // 重置已选择的看板
    initSaveInfo() {
      // this.chartSaveInfo.title = ''; // 图表名称
      this.chartSaveInfo.name = ''; // panel名称创建
      this.chartSaveInfo.panelId = ''; // 选择panel
    },
    close() {
      this.elementTarget = {}; // 初始化清空参数
      this.initInfo();
      this.chartModal = false;
    },
    // 初始化信息
    initInfo() {
      this.chartInfo.title = '';
      this.chartInfo.type = 1;
      this.chartInfo.span = 12;
      this.chartInfo.height = 400;
      this.elements = [1];
      this.elementTarget = {};
    },
    // 生成预览图表
    preview(params) {
      if (params === 'change') {
        this.chartCount = this.chartCount === 'single' ? 'multiple' : 'single';
      }
      this.elementTarget = {}; // 初始化清空参数
      // 触发每个tag组件内部进行校验
      this.$refs.chartTag.saveTarget(); // => getTartget
      // 保存图表时进行参数认证
      if (this.isSave) {
        this.$refs.chartInfo.validate();
      }
    },
    // 获取每个tag组件内部校验后数据,点击生成图表时触发
    getTarget(target) {
      // 由于条件限制，每次其实只有一个target
      this.elementTarget = JSON.parse(JSON.stringify(target));
      this.$refs.chartInfo.validate((valid) => {
        if (valid) {
          this.loading = true;
          // 保存图表到看板
          const params = Object.assign({}, this.chartInfo);
          params.metric = this.elementTarget.metric;
          params.tags = this.tagsToString(this.elementTarget.tagSets);
          this.metricInfo = params;
          this.saveDisabled = false; // 查询成功以后,可以进行保存操作
          // 将参数返回,进行查询
          this.$emit('on-view-chart', params, this.chartCount);
        }
      });
    },
    // 确认创建图表
    createConfirm() {
      this.$refs.chartInfo.validate((valid) => {
        if (valid) { // 先判断参数正确与否
          this.$refs.chartSaveInfo.validate((flag) => {
            if (flag) { // 再判断弹出窗口内内容是否正确
              if (this.isCreatePanel) { // 创建看板
                this.addPanels();
              } else { // 选择看板
                this.panelId = this.chartSaveInfo.panelId;
                this.getOptions();
              }
            }
          });
        }
      });
    },
    // 创建看板接口
    addPanels() {
      addPanels({
        productId: this.productId,
        name: this.chartSaveInfo.name,
      }).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.panelId = res.data.panel.id;
          this.getOptions();
        } else {
          this.$Message.warning('创建看板失败');
        }
      });
    },
    // 生成图表的时候,使用该函数,汇总创建图表参数
    getOptions() {
      this.$refs.chartInfo.validate((valid) => {
        const params = {
          productId: this.productId,
          panelId: this.panelId,
          // title: this.chartSaveInfo.title,
          type: this.chartInfo.type,
          span: this.chartInfo.span,
          height: this.chartInfo.height,
        };
        // 多图模式
        if (this.chartCount === 'multiple') {
          this.createChartList = [];
          this.seriesData.forEach((queryItem) => {
            const soleParam = Object.assign({}, params);
            const elements = [];
            let tagStr = ''; // tag字符串
            let host = `${queryItem.metric}, `; // 名称
            const tagsArr = Object.keys(queryItem.tags);
            // 根据图表展示时获取的tag进行组装名称以及tag字符串
            tagsArr.forEach((tag) => {
              if (tag !== 'uuid') {
                host += `${tag}=${queryItem.tags[tag]}, `;
              }
              const tagTemp = `${tag}:${queryItem.tags[tag]}`;
              if (this.elementTarget.tagSets.indexOf(tagTemp) > -1) {
                if (tagStr) {
                  tagStr += `,${tagTemp.replace(/:/g, '=')}`;
                } else {
                  tagStr += tagTemp.replace(/:/g, '=');
                }
              }
            });
            // 图表中每条线的名字,去掉最后的逗号与空格
            host = host.substring(0, host.length - 2);
            soleParam.title = host;
            elements.push({
              metric: this.elementTarget.metric,
              tags: tagStr,
            });
            soleParam.elements = elements;
            if (valid) {
              this.addMultipleChart(soleParam);
            }
          });
        } else if (this.chartCount === 'single') {
          params.title = this.chartSaveInfo.title;
          const elements = [];
          const tagStr = this.tagsToString(this.elementTarget.tagSets);
          elements.push({
            metric: this.elementTarget.metric,
            tags: tagStr,
          });
          params.elements = elements;
          if (valid) {
            this.addCharts(params);
          }
        }
      });
    },
    // 新建单个图表single
    addCharts(params) {
      addCharts(params).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$Message.success('添加成功');
            this.createModal = false;
            this.elementTarget = {};
            this.saveDisabled = true; // 创建成功后,不能再次创建
            // this.initInfo();
            // this.$emit('on-create-success', 'create', res.data);
            this.$Modal.confirm({
              title: '创建成功',
              content: `是否前去查看创建的图表${res.data.chart.title}`,
              onOk: () => {
                this.$router.push({
                  path: `/console/panel/detail/${this.panelId}/${this.productId}`,
                });
              },
            });
          } else {
            this.$Mesaage.error(res.code.message);
          }
        }
      });
    },
    // 创建多个图表
    addMultipleChart(params) {
      this.createChartList.push(params);
      if (this.seriesData.length === this.createChartList.length) {
        const api = [];
        this.createChartList.forEach((item) => {
          api.push(addCharts(item));
        });
        axios.all(api).then((res) => {
          let successFlag = true;
          res.forEach((item) => {
            if (item.data.code !== 200) {
              successFlag = false;
            }
          });
          if (successFlag) {
            this.saveDisabled = true; // 创建成功后,不能再次创建
            this.$Message.success('添加成功');
            this.createModal = false;
            this.elementTarget = {};
            this.createChartList = [];
            this.$Modal.confirm({
              title: '创建成功',
              content: '是否前去查看创建的图表',
              onOk: () => {
                this.$router.push({
                  path: `/console/panel/detail/${this.panelId}/${this.productId}`,
                });
              },
            });
          } else {
            this.$Message.error('添加失败');
          }
        });
      }
    },
    // 获取看板列表
    getPanels(params) {
      const obj = Object.assign({}, params);
      if (!obj.query) delete obj.query;
      getPanels(obj).then((res) => {
        if (res.status === 200) {
          this.total = res.data.total;
          this.panelList = res.data.panels;
        } else {
          this.total = 0;
          this.panelList = [];
        }
      });
    },
    // 增加指标
    addTarget() {
      // tarNum
      this.elements.push(1);
    },
    // 删除指标
    deleteTarget(index) {
      this.elements.splice(index, 1);
    },
    // 获取metric列表
    getSuggestMetric(id) {
      getSuggestMetric({
        product_id: id,
      }).then((res) => {
        if (res.status === 200) {
          this.metricList = res.data.metrics;
        } else {
          this.metricList = [];
        }
      });
    },
    // 获取文本宽度
    getWidth(str) {
      const sensor = document.createElement('pre');
      sensor.innerHTML = str;
      sensor.style.display = 'inline-block';
      sensor.style.width = 'auto';
      sensor.style.visibility = 'hidden';
      sensor.style.height = 0;
      sensor.style.position = 'relative';
      sensor.style['z-index'] = -10;
      document.body.appendChild(sensor);
      const width = sensor.offsetWidth;
      document.body.removeChild(sensor);
      return width;
    },
    // 创建打开
    createData(panelId) {
      this.panelId = panelId;
      this.elementTarget = {}; // 初始化清空参数
      this.initInfo(); // 初始化图表信息
      this.chartModal = true;
      this.initOpen(); // 获取metric, productId数据
      this.elements = [1];
    },
    tagsToString(arr) {
      let str = '';
      const tagObj = {};
      arr.forEach((item) => {
        const tagItem = item.split(':');
        if (!tagObj[tagItem[0]]) {
          tagObj[tagItem[0]] = [];
          tagObj[tagItem[0]].push(tagItem[1]);
        } else {
          tagObj[tagItem[0]].push(tagItem[1]);
        }
      });
      Object.keys(tagObj).forEach((item, index) => {
        if (index === 0) {
          str += `${item}=${tagObj[item].join('|')}`;
        } else {
          str += `,${item}=${tagObj[item].join('|')}`;
        }
      });
      return str;
    },
  },
  mounted() {
    // 默认打开
    this.initOpen();
  },
  beforeDestroy() {
  },
};

</script>
