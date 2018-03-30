<template>
  <div :style="circleSize" class="wrapClasses">
    <svg viewBox="0 0 100 100">
      <path :d="pathString" :stroke="trailColor" :stroke-width="trailWidth" :fill-opacity="0" />
      <path :d="pathString" :stroke-linecap="strokeLinecap" :stroke="strokeColor" :stroke-width="strokeWidth" fill-opacity="0" :style="pathStyle" />
    </svg>
    <div class="innerClasses">
      <slot></slot>
    </div>
  </div>
</template>
<script>
export default {
  name: 'circleSvg',
  props: {
    percent: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 120,
    },
    strokeWidth: {
      type: Number,
      default: 8,
    },
    strokeColor: {
      type: String,
      default: '#5697f1',
    },
    strokeLinecap: {
      type: String,
      default: 'round',
    },
    trailWidth: {
      type: Number,
      default: 8,
    },
    trailColor: {
      type: String,
      default: '#eaeef2',
    },
  },
  computed: {
    circleSize() {
      return {
        width: `${this.size}px`,
        height: `${this.size}px`,
      };
    },
    per() {
      if (this.percent > 96 && this.percent !== 100) {
        return this.percent - 3;
      }
      return this.percent;
    },
    radius() {
      return 50 - (this.strokeWidth / 2);
    },
    pathString() {
      return `M 50,50 m 0,-${this.radius}
                a ${this.radius},${this.radius} 0 1 1 0,${2 * this.radius}
                a ${this.radius},${this.radius} 0 1 1 0,-${2 * this.radius}`;
    },
    len() {
      return Math.PI * 2 * this.radius;
    },
    pathStyle() {
      return {
        'stroke-dasharray': `${this.len}px ${this.len}px`,
        'stroke-dashoffset': `${(((100 - this.per) / 100) * this.len)}px`,
        transition: 'stroke-dashoffset 0.6s ease 0s, stroke 0.6s ease',
      };
    },
  },
};

</script>
<style scoped>
.wrapClasses {
  /* display: inline-block;
        position: relative; */
  position: relative;
  margin: 0 auto;
}

.innerClasses {
  width: 100%;
  text-align: center;
  position: absolute;
  left: 0;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -moz-transform: translateY(-50%);
  transform: translateY(-50%);
}

</style>
