<style lang="scss">
  @import './chart-add.scss'
</style>
<template>
  <div>
    <Modal width="830" class="chart-add" :title="chartTitle" v-model="chartModal" @on-cancel="close">
      <!-- <div class="search-data">
        <Button size="small" icon="chevron-left" type="primary" @click="backChart()"></Button>
        <span class="search-data-title">为图表添加指标</span>
      </div> -->
      <div class="data-body scroll" id='data-body'>
        <Form :model="chartInfo" ref="chartInfo">
          <Row>
            <div class="common-float-left">
              <Form-item :label-width="80" label="图表名称" prop="title" :rules="{ required: true, type: 'string', message: '请输入图表名称', trigger: 'change' }">
                <Input style="width: 360px;" v-model="chartInfo.title"></Input>
              </Form-item>
            </div>
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
        </Form>
        <Row class="element-item" v-for="(elem, index) in elements" :key="'ele' + index">
          <chart-tag ref="chartTag" 
          :product-id="productId"
          :pointer="index" 
          :metric-list="metricList"
          @on-delete-target="deleteTarget" 
          @on-add-target-success="getTarget"
          ></chart-tag>
        </Row>
      </div>
      <Row>
        <Button type="primary" @click="addTarget">添加指标</Button>
      </Row>
      <div slot="footer" class="clearfix">
        <Button @click="close">取消</Button>
        <Button type="primary" @click="confirmAdd">保存</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import bus from '../../libs/bus';
import { addCharts, updateCharts, getSuggestMetric } from '../../models/service';
import chartTag from './chart-tag';

export default {
  name: 'chartAdd',
  props: {
  },
  components: {
    chartTag,
  },
  data() {
    return {
      editInfo: {},
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
      elementTarget: [],
      // 宽度列表
      spanList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      typeList: [{
        id: 1,
        name: '曲线',
      }, {
        id: 2,
        name: '柱状图',
      }],
      // 是否为编辑已有信息
      isedit: false,
      productId: 0,
      panelId: 0,
      metricList: [], // metric列表
    };
  },
  computed: {
    // 标题
    chartTitle() {
      return this.isedit ? '编辑图表' : '添加图表';
    },
  },
  watch: {},
  methods: {
    // 创建打开
    createData(panelId) {
      this.panelId = panelId;
      this.isedit = false;
      this.initInfo(); // 初始化图表信息
      this.chartModal = true;
      this.initOpen(); // 获取metric, productId数据
      // this.elementTarget = []; // 初始化清空参数
      // this.elements = [1];
    },
    // 编辑chart时使用, set_tdata
    editData(data, panelId, productId) {
      this.panelId = panelId;
      this.productId = productId;
      this.isedit = true;
      this.chartModal = true;
      this.editInfo = data;
      // 图表信息获取
      this.chartId = data.id;
      this.chartInfo.title = data.title;
      this.chartInfo.span = data.span;
      this.chartInfo.height = data.height;
      this.chartInfo.type = data.type;
      this.getSuggestMetric(this.productId);
      // 指标
      this.elements = [];
      data.elements.forEach((item, index) => {
        this.elements.push(index);
      });
      this.$nextTick(() => {
        const cSet = this.$refs.chartTag;
        // 派发charttag数据
        cSet.forEach((item, index) => {
          item.setMdata(data.elements[index]);
        });
      });
    },
    // 默认打开
    initOpen() {
      bus.$emit('clear_history');
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.getSuggestMetric(this.productId);
    },
    close() {
      this.elementTarget = []; // 初始化清空参数
      this.initInfo();
      this.chartModal = false;
      this.isedit = false;
      bus.$emit('clear_history'); // 清除charttag中内容
      // bus.$emit('add_close');
    },
    // 初始化信息
    initInfo() {
      this.chartInfo.title = '';
      this.chartInfo.type = 1;
      this.chartInfo.span = 12;
      this.chartInfo.height = 400;
      this.elements = [1];
      this.elementTarget = [];
    },
    // 生成图表
    confirmAdd() {
      this.elementTarget = []; // 初始化清空参数
      this.$refs.chartTag.forEach((item, index) => {
        // 触发每个tag组件内部进行校验
        item.saveTarget(index);
      });
      this.$refs.chartInfo.validate();
    },
    // 获取每个tag组件内部校验后数据,点击生成图表时触发
    getTarget(target) {
      this.elementTarget.push(target);
      if (this.elementTarget.length === this.elements.length) {
        this.$refs.chartInfo.validate((valid) => {
          const params = {
            productId: this.productId,
            panelId: this.panelId,
            title: this.chartInfo.title,
            type: this.chartInfo.type,
            span: this.chartInfo.span,
            height: this.chartInfo.height,
          };
          const elements = [];
          this.elementTarget.forEach((elem) => {
            const tagStr = this.tagsToString(elem.tagSets);
            elements.push({
              // name: elem.name,
              metric: elem.metric,
              tags: tagStr,
            });
          });
          params.elements = elements;
          if (valid) {
            if (this.isedit) {
              params.id = this.chartId;
              this.updateCharts(params);
            } else {
              this.addCharts(params);
            }
          }
        });
      }
    },
    // 新建图表
    addCharts(params) {
      addCharts(params).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.chartModal = false;
            this.elementTarget = [];
            this.initInfo();
            this.$emit('on-create-success', 'create', res.data);
            // 新建图表
            // bus.$emit('chart_id', res.data.chart);
            // bus.$emit('clear_history');
          } else {
            this.$Mesaage.error(res.code.message);
          }
        }
      });
    },
    // 更新图表
    updateCharts(params) {
      const obj = params;
      obj.id = this.chartId;
      updateCharts(obj).then((res) => {
        if (res.status === 200) {
          this.chartModal = false;
          this.elementTarget = [];
          this.initInfo();
          this.$emit('on-create-success', 'update', res.data);
          // 更新已有图表
          // bus.$emit('update_relate', res.data.chart);
          // bus.$emit('clear_history');
        }
      });
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
    // 退回看板添加
    backChart() {
      this.chartModal = false;
      bus.$emit('back-to-add-chart');
      // bus.$emit('back_add');
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
  },
  mounted() {
    // 创建
    bus.$on('create_data', (panelId) => {
      this.createData(panelId);
    });
    // 编辑chart时使用, set_tdata
    this.$on('on-edit-chart-data', (data) => {
      this.editData(data);
    });
  },
  beforeDestroy() {
    bus.$off('create_data');
  },
};

</script>
