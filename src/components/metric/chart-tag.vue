<style lang="scss">
  @import './chart-tag.scss'
</style>
<template>
  <Form class="chart-tag-metric" :model="elementInfo" ref="elementInfo">
    <Row>
      <FormItem :label-width="60" label="metric" prop="metric" :rules="{ required: true, type: 'string', message: '请输入metric名称', trigger: 'change' }">
        <AutoComplete v-model="elementInfo.metric"
        :data="metricList" 
        :filter-method="filterMethod" 
        placeholder="metric"
        @on-search="selectMetric"
        @on-select="selectMetric"></AutoComplete>
      </FormItem>
    </Row>
    <Row v-if="elementInfo.tagList.length > 0">
      <FormItem v-for="(item, index) in elementInfo.tagList" :key="index" :label="item.name" :label-width="100" :prop="'tagList.' + index + '.value'" :rules="{ required: true, type: 'array', min: 1, message: '请选择tag值'}">
        <Select v-model="item.value" ref="tagSelect"
        @on-change="selectTag"
        placeholder="请选择tag值"
        multiple 
        filterable 
        transfer
        not-found-text="">
          <Option v-for="(op, j) in item.list" :key="op + j"
          :value="op">{{op}}</Option>
        </Select>
      </FormItem>
    </Row>
  </Form>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import { getSuggestTags } from '../../models/service';

export default {
  name: 'chartTag',
  props: {
    // 产品id
    productId: {
      type: Number,
      default: 0,
    },
    // 序号
    pointer: {
      type: Number,
      default: 0,
    },
    // metric列表
    metricList: {
      type: Array,
      default: () => [],
    },
  },
  components: {},
  data() {
    return {
      // 指标信息
      elementInfo: {
        metric: '',
        // name: '',
        tagList: [],
      },
      metricLoading: false,
      tagSet: null, // 根据你metric获取的tags信息
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  methods: {
    // 选择metric
    // eslint-disable-next-line
    selectMetric: _.debounce(function() {
      if (this.elementInfo.metric) {
        const params = {
          product_id: this.productId,
          metric: this.elementInfo.metric,
        };
        this.getSuggestTags(params);
      } else {
        this.elementInfo.tagList = [];
      }
      this.$emit('on-change-condition');
    }, 300),
    // 选择标签
    selectTag() {
      this.$emit('on-change-condition');
    },
    // 获取tags列表
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200) {
          this.tagSet = res.data.tag_set;
          this.elementInfo.tagList = [];
          if (res.data.code === 200) {
            const keyList = Object.keys(res.data.tag_set);
            keyList.forEach((item) => {
              if (item !== 'uuid') { // 滤除uuid
                const tagObj = {
                  name: item,
                  list: this.tagSet[item],
                  value: [],
                };
                this.elementInfo.tagList.push(tagObj);
              }
            });
          }
        } else {
          this.elementInfo.tagList = [];
        }
      });
    },
    getStyles(width) {
      return `width: ${width}px;`;
    },
    // 筛选
    filterMethod(value, option) {
      if (!value) return true; // value为空时返回全部
      return option.toUpperCase().indexOf(value.toUpperCase()) !== -1;
    },
    // 保存, chartdata点击确认后保存本身数据并返回给chartdata
    saveTarget() {
      this.$refs.elementInfo.validate((valid) => {
        if (valid) {
          this.$emit('on-add-target-success', this.elementInfo);
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
      const widthL = width > 180 ? width : 180;
      return widthL;
    },
  },
  mounted() {
  },
};

</script>
