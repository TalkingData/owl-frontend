<style lang="scss">
  @import './chart-add.scss';
</style>
<template>
  <div>
    <Modal width="900" class="chart-add" :title="chartTitle" v-model="chartModal" @on-cancel="close">
      <div class="data-body scroll" id='data-body'>
        <Form :model="chartInfo" ref="chartInfo">
          <Row>
            <div class="common-float-left">
              <FormItem :label-width="80" label="图表名称" prop="title" :rules="{ required: true, type: 'string', message: '请输入图表名称', trigger: 'change' }">
                <Input style="width: 360px;" v-model="chartInfo.title"></Input>
              </FormItem>
            </div>
            <div class="common-float-left">
              <FormItem :label-width="80" label="类型" prop="type"
              :rules="{ required: true, type: 'number', message: '请选择图表类型', trigger: 'change' }">
                <Select transfer style="width:100px;" v-model="chartInfo.type" @on-change="selectType">
                  <Option v-for="item in typeList" 
                    :key="item.id" 
                    :label="item.name" 
                    :value="item.id">
                    {{item.name}}
                  </Option>
                </Select>
              </FormItem>
            </div>
          </Row>
          <Row>
            <div class="common-float-left">
              <FormItem :label-width="80" label="图宽" prop="span"
              :rules="{ required: true, type: 'number', message: '请选择图表宽度', trigger: 'change' }">
                <Select style="width:100px;" v-model="chartInfo.span" transfer>
                  <Option v-for="item in spanList" :key="item" :disabled="spanDisable && item < 6" :label="'span-' + item" :value="item">
                    span-{{item}}
                  </Option>
                </Select>
              </FormItem>
            </div>
            <div class="common-float-left">
              <FormItem :label-width="80" label="图高" prop="height"
              :rules="{ required: true, type: 'number', message: '请输入图表高度', trigger: 'change' }">
                <InputNumber :min="10" v-model="chartInfo.height" style="width: 100px" placeholder="请输入图表高度"></InputNumber>px
              </FormItem>
            </div>
          </Row>
        </Form>
        <Row class="element-item" v-for="(elem, index) in elements" :key="'ele' + index">
          <chart-tag ref="chartTag" 
          :product-id="productId"
          :pointer="index" 
          :metric-list="metricList"
          :count-total="elements.length"
          @on-delete-target="deleteTarget" 
          @sub-save-ok="subOk"
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
      elementTarget: [], // 本地保存数据
      // 宽度列表
      spanList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      typeList: [{
        id: 1,
        name: '曲线',
      }, {
        id: 2,
        name: '柱状图',
      }, {
        id: 3,
        name: '表格',
      }, {
        id: 4,
        name: '曲线汇总',
      }],
      // 是否为编辑已有信息
      isedit: false,
      productId: 0,
      panelId: 0,
      metricList: [], // metric列表
      deleteIndex: '', // 要删除的指标模块
      subCount: 0, // subSave保存data到bus计数器
    };
  },
  computed: {
    // 标题
    chartTitle() {
      return this.isedit ? '编辑图表' : '添加图表';
    },
    spanDisable() {
      if (this.chartInfo.type === 3) {
        return true;
      }
      return false;
    },
  },
  watch: {},
  methods: {
    selectType(num) {
      if (num === 3) {
        this.chartInfo.span = 12;
      }
    },
    // 创建打开
    createData(panelId) {
      this.panelId = panelId;
      this.isedit = false;
      this.initInfo(); // 初始化图表信息
      this.chartModal = true;
      this.initOpen(); // 获取metric, productId数据
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
      bus.chartAddInfo.metricTarget = [];
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
    // 创建时打开,用于清空chart-tag数据
    initOpen() {
      bus.$emit('clear_history');
      if (this.$route.params.productId) {
        this.productId = parseInt(this.$route.params.productId, 10);
      }
      this.getSuggestMetric(this.productId);
    },
    close() {
      this.initInfo();
      this.chartModal = false;
      this.isedit = false;
      bus.$emit('clear_history'); // 清除charttag中内容
      this.$refs.chartInfo.resetFields();
    },
    // 初始化信息
    initInfo() {
      this.chartInfo.title = '';
      this.chartInfo.type = 1;
      this.chartInfo.span = 12;
      this.chartInfo.height = 400;
      this.elements = [1];
      this.elementTarget = [];
      bus.chartAddInfo.metricTarget = [];
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
            const tagStr = this.tagsToString(elem.tagList);
            elements.push({
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
            this.initInfo();
            this.$refs.chartInfo.resetFields();
            this.$emit('on-create-success', 'create', res.data);
          } else {
            this.$Message.error(`创建失败：${res.data.message || res.statusText}`);
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
          this.initInfo();
          this.$refs.chartInfo.resetFields();
          this.$emit('on-create-success', 'update', res.data);
        }
      });
    },
    // 格式化tag
    tagsToString(arr) {
      let str = '';
      arr.forEach((item, index) => {
        if (index === 0) {
          str += item.value.indexOf('all') > -1 ? `${item.name}=all` : `${item.name}=${item.value.join('|')}`;
        } else {
          str += item.value.indexOf('all') > -1 ? `,${item.name}=all` : `,${item.name}=${item.value.join('|')}`;
        }
      });
      return str;
    },
    // 增加指标,tarNum
    addTarget() {
      this.elements.push(1);
    },
    // 删除指标,第一步, 新方法
    deleteTarget(index) {
      this.deleteIndex = index;
      this.$refs.chartTag.forEach((item) => {
        // 子组件保存内容到bus
        item.subSave();
      });
    },
    // subSave保存成功后回调,第二步
    subOk() {
      // 每个模块均有返回,当全部模块返回完成时,将sub计数器重置
      this.subCount += 1;
      if (this.subCount === this.elements.length) {
        this.subCount = 0;
        // 保存完成,进行删除操作
        this.elements.splice(this.deleteIndex, 1);
        this.elementTarget.splice(this.deleteIndex, 1);
        bus.chartAddInfo.metricTarget.splice(this.deleteIndex, 1);
        this.$nextTick(() => {
          this.$refs.chartTag.forEach((item, index) => {
            item.setSubdata(index); // 将数据从bus重新赋值
          });
        });
      }
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
  },
  beforeDestroy() {
  },
};

</script>
