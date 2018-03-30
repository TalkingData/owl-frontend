<style lang="scss">
  @import './chart-tag.scss'
</style>
<template>
  <Form class="chart-tag" :model="elementInfo" ref="elementInfo">
    <!-- <Form-item :label-width="80" label="指标名称" prop="name" :rules="{ required: true, type: 'string', message: '请输入指标名称', trigger: 'change' }">
      <Input style="width: 360px;" v-model="elementInfo.name"></Input>
    </Form-item> -->
    <Row>
      <Col span="12">
      <Form-item :label-width="80" label="metric" prop="metric" :rules="{ required: true, type: 'string', message: '请输入metric名称', trigger: 'change' }">
        <Select v-model="elementInfo.metric" filterable transfer @on-change="selectMetric">
          <Option v-for="(item, index) in metricList" :key="item + index"
          :value="item">{{item}}</Option>
        </Select>
      </Form-item>
      </Col>
      <Col span="12">
        <!-- <Button class="ml-10" icon="plus" @click="addTags">添加Tag</Button> -->
        <Button class="ml-10" v-if="pointer > 0" icon="trash-a" @click="deleteTarget">删除指标</Button>
      </Col>
    </Row>
    <Row>
      <Form-item label="Tag" :label-width="80" prop="tagSets" :rules="{ required: true, type: 'array', min: 1, message: '请选择tag'}">
        <Select v-model="elementInfo.tagSets" 
        :label="elementInfo.tagSets"
        multiple 
        filterable 
        transfer
        :loading="false"
        remote
        :remote-method="remoteSearch"
        loading-text="请选择tag"
        not-found-text="">
          <Option v-for="(item, index) in optionList" :key="item + index"
          :value="item">{{item}}</Option>
        </Select>
      </Form-item>
    </Row>
  </Form>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
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
        tags: [{
          key: '',
          value: '',
          valueList: [],
        }],
        tagSets: [],
      },
      metricLoading: false,
      // metricList: [], // metric列表
      keydataList: [], // tag标签键列表
      valuedataList: [], // tag标签值列表
      target: null, // 获取到的数据
      tagSet: null, // 根据你metric获取的tags信息
      keyValueList: [], // tag组合列表
      optionList: [],
      setDataFlag: false, // true时为获取数据,编辑状态
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  methods: {
    // 选择metric
    // eslint-disable-next-line
    selectMetric() {
      if (this.elementInfo.metric) {
        const params = {
          product_id: this.productId,
          metric: this.elementInfo.metric,
        };
        this.getSuggestTags(params);
      } else {
        this.elementInfo.tagSets = [];
        this.keyValueList = [];
        this.optionList = [];
      }
    },
    // 获取tags列表
    getSuggestTags(params) {
      getSuggestTags(params).then((res) => {
        if (res.status === 200 && res.data.code === 200) {
          this.tagSet = res.data.tag_set;
          this.keydataList = Object.keys(res.data.tag_set);
          this.keyValueList = [];
          this.optionList = [];
          // 初始化编辑时不重置
          if (!this.setDataFlag) {
            this.elementInfo.tagSets = [];
          } else { // 编辑的时候,先取得列表,再获取已选择tag
            // this.proTags(this.target.tags);
            this.setDataFlag = false;
          }
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
    saveTarget(pointer) {
      if (this.pointer === pointer) {
        this.$refs.elementInfo.validate((valid) => {
          if (valid) {
            this.$emit('on-add-target-success', this.elementInfo, pointer);
          }
        });
      }
    },
    // 编辑已有图表状态时，先填充数据
    setMdata(data) {
      this.setDataFlag = true;
      this.target = Object.assign({}, data);
      // this.elementInfo.name = data.name;
      this.elementInfo.metric = data.metric;
      this.proTags(data.tags);
      // this.proTags(this.target.tags);
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
            // const width = this.getWidth(keyV) + 20;
            tmp.push(`${set[0]}:${keyV}`);
          });
        } else {
          // const width = this.getWidth(set[1]) + 20;
          tmp.push(`${set[0]}:${set[1]}`);
        }
      } else {
        const mid = data.split(','); // ['key=v1','key=v2',....]
        mid.forEach((item) => {
          const setInner = item.split('=');
          if (setInner[1].indexOf('|') > -1) {
            const valueArr = setInner[1].split('|');
            valueArr.forEach((keyV) => {
              // const width = this.getWidth(keyV) + 20;
              tmp.push(`${setInner[0]}:${keyV}`);
            });
          } else {
            // const width = this.getWidth(setInner[1]) + 20;
            tmp.push(`${setInner[0]}:${setInner[1]}`);
          }
        });
      }
      this.elementInfo.tagSets = tmp;
    },
  },
  mounted() {
    bus.$on('clear_history', () => {
      this.tags = [];
      // this.elementInfo.name = '';
      this.elementInfo.metric = '';
      this.elementInfo.tags = [{
        key: '',
        value: '',
        valueList: [],
        valueWidth: 200,
      }];
      // this.elementInfo.tagSets = [];
      this.keyValueList = [];
      this.setDataFlag = false;
    });
  },
};

</script>
