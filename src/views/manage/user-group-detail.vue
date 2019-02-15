<style lang="scss">
@import './user-group-detail.scss';

</style>
<template>
  <div class="main-container user-group-detail">
    <div class="common-detail-top common-detail-top-fixed clearfix">
      <div class="float-left">
        <span title="返回到用户组列表页" @click="backTo" class="common-detail-top-title">用户组列表&gt;</span>
        <span>&nbsp;用户组名称 : {{userGroupItem.name || '--'}}</span>
      </div>
      <div class="float-right" v-if="userGroupItem.description">
        <span>用户组描述 : {{userGroupItem.description}}</span>
      </div>
    </div>
    <div class="common-detail-margin">
      <user-list source="group"></user-list>
    </div>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
import userList from '../../components/manage/user-list';

export default {
  name: 'userGroupDetail',
  components: {
    userList,
  },
  props: {},
  data() {
    return {
      filter: {},
      groupId: 0,
      userGroupItem: {}, // 用户组信息
    };
  },
  methods: {
    backTo() {
      this.$router.push({
        path: `/manage/user/group/list/${this.$route.params.productId}`,
      });
    },
    // 初始化获取数据
    getDetailData() {
      if (this.$route.params.productId) {
        this.filter.productId = parseInt(this.$route.params.productId, 10);
      }
      this.groupId = parseInt(this.$route.params.usergroupId, 10); // 用户组id
      const str = localStorage.getItem('userGroupItem');
      const userGroupItem = JSON.parse(str);
      this.userGroupItem = userGroupItem;
      this.filter.groupId = this.groupId;
    },
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    this.getDetailData();
  },
  beforeDestroy() {},
};

</script>
