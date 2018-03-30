<style lang="scss">
@import './rule-block.scss'

</style>
<template>
  <div class="rule-block-show">
    <div class="view-mid">
      <Row>
        <Col span="1">
          <div class="float-left rule-title">
            <div class="rule-title-label">
              {{data.index}}
            </div>
          </div>
        </Col>
        <Col span="21" class="metric-main">
          <div class="float-left float-item ml-10 mr-10">
            metric:
          </div>
          <div class="float-left">
            <Input v-model="data.metric" disabled></Input>
          </div>
          <div class="float-left ml-10 float-item">
            计算规则
          </div>
          <div class="float-left ml-10">
            <Select disabled style="width:100px;" v-model="data.method" disabled>
              <Option v-for="item in methodArr" :key="item.value" :value="item.value" :label="item.label">{{item.label}}</Option>
            </Select>
          </div>
          <div class="float-left ml-10" v-if="data.method=='top'||data.method=='bottom'||data.method=='last'||data.method=='ratio'">
            <Input v-model="data.number" disabled></Input>
          </div>
          <div class="float-left ml-10 float-item">
            <span class="character">—</span>
          </div>
          <div class="float-left ml-10">
            <Select style="width:80px;" v-model="data.symbol" disabled>
              <Option v-for="item in symbolArr" :key="item" :value="item" :label="item">{{item}}</Option>
            </Select>
          </div>
          <div class="float-left ml-10">
            <Input v-model="dataThreshold" placeholder="threshold" disabled></Input>
          </div>
          <div class="float-left float-item ml-10" style="color:#f00;">
            {{getUnit(data.current_threshold)}}
          </div>
          <div class="float-left float-item ml-10 mr-10">
            tags:
          </div>
          <div class="float-left float-item mr-10" v-for="(tag, index) in tags" :key="index">
            <div class="tag-block">
              <span>{{tag.key}}</span>:
              <span>{{tag.value}}</span>
            </div>
          </div>
          <div class="float-left float-item mr-10" v-if="tags.length === 0">暂无</div>
        </Col>
      </Row>
    </div>
  </div>
</template>
<script>
// import bus from '../../../libs/bus';

export default {
  name: 'ruleBlock',
  components: {},
  props: {
    // 该模块顺序码
    // num: {
    //   type: Number,
    //   default: -1,
    // },
    data: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      // 函数数组
      methodArr: [{
        value: 'max',
        label: '最大值',
      }, {
        value: 'min',
        label: '最小值',
      }, {
        value: 'ratio',
        label: '环比',
      }, {
        value: 'top',
        label: 'Top',
      }, {
        value: 'bottom',
        label: 'Bottom',
      }, {
        value: 'last',
        label: 'Last',
      }, {
        value: 'nodata',
        label: 'Nodata',
      }, {
        value: 'diff',
        label: 'Diff',
      }, {
        value: 'avg',
        label: '平均值',
      }],
      symbolArr: ['==', '>=', '>', '<=', '<', '!='],
      flag: 0, // 交换规则
    };
  },
  methods: {
    getUnit(num) {
      if (num >= 1000) {
        const kbNum = num / 1000;
        if (kbNum >= 1000) {
          const mbNum = kbNum / 1000;
          if (mbNum > 1000) {
            const gbNum = mbNum / 1000;
            if (gbNum > 1000) {
              const tbNum = gbNum / 1000;
              if (tbNum > 1000) {
                const pbNum = tbNum / 1000;
                return `${pbNum.toFixed(2)}PB`;
              }
              return `${tbNum.toFixed(2)}TB`;
            }
            return `${gbNum.toFixed(2)}GB`;
          }
          return `${mbNum.toFixed(2)}MB`;
        }
        return `${kbNum.toFixed(2)}KB`;
      }
      return num.toFixed(2);
    },
    // 将后台拿到的“k1=v1,k2=v2...”转为[{key:k1,value:v1},{key:k2,value:v2}....]
    proTags(data) {
      const dou = data.indexOf(',');
      const tmp = [];
      if (dou === -1) {
        const set = data.split('=');
        tmp.push({ key: set[0], value: set[1] });
      } else {
        const mid = data.split(',');
        const mlen = mid.length;
        for (let j = 0; j < mlen; j += 1) {
          const set = mid[j].split('=');
          tmp.push({ key: set[0], value: set[1] });
        }
      }
      this.tags = tmp;
    },
  },
  computed: {
    dataThreshold() {
      return this.getUnit(this.data.threshold);
    },
    tags() {
      const dou = this.data.tags.indexOf(',');
      const tmp = [];
      if (dou === -1) {
        const set = this.data.tags.split('=');
        if (set.length > 1) {
          tmp.push({ key: set[0], value: set[1] });
        }
      } else {
        const mid = this.data.tags.split(',');
        const mlen = mid.length;
        for (let j = 0; j < mlen; j += 1) {
          const set = mid[j].split('=');
          tmp.push({ key: set[0], value: set[1] });
        }
      }
      return tmp;
    },
  },
  watch: {
  },
  mounted() {
  },
  beforeDestroy() {},
};

</script>
