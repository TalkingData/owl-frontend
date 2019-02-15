<style lang="scss">
  @import './login.scss';
</style>
<template>
  <div class="login">
    <Spin fix>
      <Icon type="load-c" size=18 class="demo-spin-icon-load"></Icon>
      <div>Loading</div>
    </Spin>
  </div>
</template>
<script>
import axios from 'axios';
import Cookies from 'js-cookie';
import md5 from 'md5';
import { getUserInfo } from '../../models/service';
import { serviceInfo } from '../../models/index';
// import bus from '../../libs/bus';

export default {
  data() {
    return {
    };
  },
  components: {
  },
  mounted() {
    if (this.$route.query.token) {
      axios.get(`${serviceInfo.loginServer}/api/v1/login?token=${this.$route.query.token}`, {
        withCredentials: true,
      }).then((res) => {
        if (res.status === 200) {
          getUserInfo().then((resp) => {
            if (resp.status === 200) {
              if (resp.data.code === 200) {
                // 保存用户角色MD5
                Cookies.set('owl_role', md5(resp.data.result.role), { expires: 1 });
                this.$router.push({ path: '/product' });
              }
            }
          });
        } else {
          axios.post(`${serviceInfo.loginServer}/api/v1/logout`, {}, {
            withCredentials: true,
          }).then((response) => {
            if (response.status === 200) getUserInfo();
          });
        }
      });
    } else {
      getUserInfo().then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            Cookies.set('owl_role', md5(res.data.result.role), { expires: 1 });
            this.$router.push({ path: '/product' });
          }
        }
      });
    }
  },
  created() {
  },
  beforeDestroy() {
  },
  methods: {
  },
};

</script>
