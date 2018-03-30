<style lang="scss">
  @import './notice-card.scss'
</style>
<template>
  <div class="notice-card" v-show="visible" :style="styles">
    <Card>
      <p slot="title">
        {{title}}
      </p>
      <a href="javascript:;" slot="extra" @click.prevent="close">
        <Icon type="close"></Icon>
      </a>
      <div>
        <Button @click="clear1">清除队列</Button>
        <Button @click="clear2">{{muteWord}}报警</Button>
      </div>
    </Card>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
// import util from '../libs/util';

export default {
  name: 'noticeCard',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    top: {
      type: Number,
      default: 0,
    },
    left: {
      type: Number,
      default: 0,
    },
    isMute: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      visible: this.value,
    };
  },
  methods: {
    close() {
      this.visible = false;
      this.$emit('on-cancel', false);
    },
    // 清除队列
    clear1() {
      this.$emit('on-clear', this.isMute);
      this.close();
    },
    // 打开、关闭队列
    clear2() {
      this.$emit('on-confirm', this.isMute);
      this.close();
    },
  },
  computed: {
    // 样式
    styles: {
      get() {
        return `top: ${this.top}px; left: ${this.left}px;`;
      },
      set(newValue) {
        this.styles = newValue;
      },
    },
    muteWord() {
      const word = this.isMute ? '关闭' : '开启';
      return word;
    },
  },
  watch: {
    value(val) {
      this.visible = val;
    },
  },
  mounted() {
  },
  beforeDestroy() {
  },
};
</script>
