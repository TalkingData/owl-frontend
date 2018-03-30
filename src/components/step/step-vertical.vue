<style lang="scss">
@import './step-vertical.scss'

</style>
<template>
  <div class="step-vertical">
    <slot></slot>
    <div class="step-bar" v-for="(item, index) in stepArr" :class="[{'open': item.isOpen, 'close': !item.isOpen}, item.status]" :key="index">
      <div class="step-header clearfix" >
        <div class="float-left" @click="showMainBox(index)">
          <i class="step-icon">{{ item.num || index + 1}}</i>
        </div>
        <div class="float-left" @click="showMainBox(index)">
          <span class="step-title">{{item.title}}</span>
        </div>
      </div>
      <div class="main-box">
        <slot :name="'mainContent' + (index + 1)"></slot>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'stepVertical',
  components: {},
  props: {
    steps: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // 步骤数据组
      stepArr: [],
    };
  },
  methods: {
    showMainBox(index) {
      this.stepArr[index].isOpen = !this.stepArr[index].isOpen;
      const steps = JSON.parse(JSON.stringify(this.stepArr));
      this.$emit('on-change-step', steps);
    },
    doneStep(index, status) {
      this.stepArr[index].status = status;
    },
    getSteps() {
      if (this.steps.length) {
        const stepsArr = JSON.parse(JSON.stringify(this.steps));
        this.stepArr = stepsArr.map((item, i) => {
          if (typeof item === 'object') {
            const obj = {
              title: item.title,
              isOpen: item.isOpen || false,
              index: i,
              status: item.status || '',
              num: item.num || 0,
            };
            return obj;
          }
          return {
            title: item,
            isOpen: false,
            index: i,
            status: '',
            num: item.num || 0,
          };
        });
      } else {
        this.stepArr = [];
      }
    },
  },
  computed: {
  },
  created() {
  },
  watch: {
    steps() {
      this.getSteps();
    },
  },
  mounted() {
    this.getSteps();
    // if (this.steps.length) {
    //   this.stepArr = this.steps.map((item, i) => {
    //     if (typeof item === 'object') {
    //       const obj = {
    //         title: item.title,
    //         isOpen: item.isOpen || false,
    //         index: i,
    //         status: item.status || '',
    //       };
    //       return obj;
    //     }
    //     return {
    //       title: item,
    //       isOpen: false,
    //       index: i,
    //       status: '',
    //     };
    //   });
    // } else {
    //   this.stepArr = [];
    // }
  },
  beforeDestroy() {},
};

</script>
