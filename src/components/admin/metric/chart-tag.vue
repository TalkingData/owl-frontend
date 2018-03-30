<style lang="scss">
  @import './chart-tag.scss'
</style>
<template>
  <Form class="chart-tag-metric" :model="elementInfo" ref="elementInfo">
    <Row>
      <Form-item :label-width="60" label="metric" prop="metric" :rules="{ required: true, type: 'string', message: '请输入metric名称', trigger: 'change' }">
        <AutoComplete v-model="elementInfo.metric"
        :data="metricList" 
        :filter-method="filterMethod" 
        placeholder="metric"
        @on-search="selectMetric"
        @on-select="selectMetric"></AutoComplete>
      </Form-item>
    </Row>
    <Row>
      <Form-item label="Tag" :label-width="60" prop="tagSets" :rules="{ required: true, type: 'array', min: 1, message: '请选择tag'}">
        <Select v-model="elementInfo.tagSets" 
        multiple 
        filterable 
        @on-change="selectTag"
        remote
        :remote-method="remoteSearch"
        :loading="false"
        loading-text="请选择tag"
        not-found-text="">
          <Option v-for="item in optionList" :key="item"
          :value="item"
          :label="item">{{item}}</Option>
        </Select>
      </Form-item>
    </Row>
  </Form>
</template>
<script>
import _ from 'lodash';
// import bus from '../../../libs/bus';
import { getSuggestTags } from '../../../models/service';

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
        tags: [{
          key: '',
          value: '',
          valueList: [],
        }],
        tagSets: [],
      },
      metricLoading: false,
      // metricList: [], // metric列表
      valuedataList: [], // tag标签值列表
      target: null, // 获取到的数据
      tagSet: null, // 根据你metric获取的tags信息
      keyValueList: [], // tag组合列表
      optionList: [],
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
        // 清空数据
        this.keyValueList = [];
        this.optionList = [];
        this.elementInfo.tagSets = [];
      }
      this.$emit('on-change-condition');
    }, 300),
    // 选择标签
    selectTag() {
      this.$emit('on-change-condition');
    },
    // 远程搜索
    // eslint-disable-next-line
    remoteSearch: _.debounce(function(query) {
      if (query !== '') {
        this.optionList = this.keyValueList.filter(item =>
          item.toLowerCase().indexOf(query.toLowerCase()) > -1);
      } else {
        this.optionList = this.keyValueList.map(item => item);
      }
    }, 300),
    // 获取tags列表
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200) {
          this.tagSet = res.data.tag_set;
          this.keyValueList = [];
          this.optionList = [];
          this.elementInfo.tagSets = [];
          if (res.data.code === 200) {
            const keyList = Object.keys(res.data.tag_set);
            keyList.forEach((item) => {
              this.tagSet[item].forEach((tagValue) => {
                this.keyValueList.push(`${item}:${tagValue}`);
                this.optionList.push(`${item}:${tagValue}`);
              });
            });
          }
        } else {
          this.keyValueList = [];
          this.optionList = [];
          this.elementInfo.tagSets = [];
        }
      });
    },
    getStyles(width) {
      return `width: ${width}px;`;
    },
    filterMethod(value, option) {
      return option.toUpperCase().indexOf(value.toUpperCase()) !== -1;
    },
    // 删除该选项
    deleteTarget() {
      this.$emit('on-delete-target', this.pointer);
    },
    addTags() {
      this.elementInfo.tags.push({
        key: '',
        value: '',
        valueList: [],
        valueWidth: 200,
      });
    },
    removetag(index) {
      this.elementInfo.tags.splice(index, 1);
    },
    // 保存, chartdata点击确认后保存本身数据并返回给chartdata
    saveTarget() {
      this.$refs.elementInfo.validate((valid) => {
        if (valid) {
          this.$emit('on-add-target-success', this.elementInfo);
        }
      });
    },
    // 编辑已有图表状态时，先填充数据
    setMdata(data) {
      this.target = data;
      // this.elementInfo.name = data.name;
      this.elementInfo.metric = data.metric;
      this.proTags(data.tags);
    },
    clearHistory() {
      this.tags = [];
      // this.elementInfo.name = '';
      this.elementInfo.metric = '';
      this.elementInfo.tags = [{
        key: '',
        value: '',
        valueList: [],
        valueWidth: 200,
      }];
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
    // 将tag添加到相应框内
    proTags(data) {
      const dou = data.indexOf(',');
      const tmp = [];
      if (dou === -1) {
        const set = data.split('=');
        if (set[1].indexOf('|') > -1) {
          const valueArr = set[1].split('|');
          valueArr.forEach((keyV) => {
            const width = this.getWidth(keyV) + 20;
            tmp.push({
              key: set[0],
              value: keyV,
              valueList: [],
              valueWidth: width,
            });
          });
        } else {
          const width = this.getWidth(set[1]) + 20;
          tmp.push({
            key: set[0],
            value: set[1],
            valueList: [],
            valueWidth: width,
          });
        }
      } else {
        const mid = data.split(','); // ['key=v1','key=v2',....]
        mid.forEach((item) => {
          const setInner = item.split('=');
          if (setInner[1].indexOf('|') > -1) {
            const valueArr = setInner[1].split('|');
            valueArr.forEach((keyV) => {
              const width = this.getWidth(keyV) + 20;
              tmp.push({
                key: setInner[0],
                value: keyV,
                valueList: [],
                valueWidth: width,
              });
            });
          } else {
            const width = this.getWidth(setInner[1]) + 20;
            tmp.push({
              key: setInner[0],
              value: setInner[1],
              valueList: [],
              valueWidth: width,
            });
          }
        });
      }
      this.elementInfo.tags = tmp;
    },
  },
  mounted() {
  },
};

</script>
