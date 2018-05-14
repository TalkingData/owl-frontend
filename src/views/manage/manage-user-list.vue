<style lang="scss">
@import './manage-user-list.scss'

</style>
<template>
  <div class="main-container manage-user-list">
    <user-list source="manage"></user-list>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
import userList from '../../components/manage/user-list';

export default {
  name: 'manageUserList',
  components: {
    userList,
  },
  props: {
  },
  data() {
    return {
    };
  },
  methods: {},
  computed: {
  },
  watch: {
  },
  mounted() {
  },
  beforeDestroy() {},
};

</script>
