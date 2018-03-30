<template>
  <div class="manage-creat-group-content-body">
    <Transfer
      :data="canChoosePeoples"
      :target-keys="choosedPeoples"
      :render-format="showContent"
      :titles="['可选人员','已选人员']"
      :operations="['取消','添加']"
      filterable
      @on-change="handleChange">
    </Transfer>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import bus from '../libs/bus';

export default {
  name: 'transfer',
  data() {
    return {
      canChoosePeoples: [],
    };
  },
  computed: mapState([
    'choosedPeoples',
  ]),
  methods: {
    ...mapMutations([
      'handleChange',
    ]),
    showContent(item) {
      return item.label;
    },
//    数据处理
    dataProcessing(data) {
      const temp = [];
      data.forEach((item, index) => {
        temp[index] = { label: '', key: '' };
        temp[index].label = data[index].username;
        temp[index].key = data[index].id;
      });
      this.canChoosePeoples = temp;
    },
  },
  mounted() {
    bus.$on('peoples', (str) => {
      this.dataProcessing(str.users);
    });
  },
};

</script>
