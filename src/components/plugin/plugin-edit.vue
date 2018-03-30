<template>
  <div>
    <Modal width="920" v-model="showModal" title="查看主机">
      <Row>
        <Button :disabled="loading" type="primary" @click="changeShowName">{{btnword}}</Button>
      </Row>
      <div class="select-transfer">
        <Transfer
        :data="sourceData"
        :target-keys="desData"
        :list-style="listStyle"
        :titles="['可选主机','已选主机']"
        :operations="['取消','添加']"
        filterable
        :filter-method="filterMethod"
        @on-change="handleChange"
        ></Transfer>
      </div>
      <div slot="footer">
        <Button @click="cancel">取消</Button>
        <Button type="primary" @click="confirmSave">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
// import bus from '../../libs/bus';
import {
  getHostOfPro,
} from '../../models/service';

export default {
  name: 'pluginEdit',
  props: {},
  components: {},
  data() {
    return {
      showModal: false,
      groupId: 0,
      sourceData: [], // 源数据
      desData: [], // 选定数据
      hostList: [], // 主机列表
      selectHost: [], // 已选主机
      hostShowType: 'name',
      listStyle: {
        width: '400px',
        height: '300px',
      },
      isEdit: false,
      isName: true, // 显示名字或者ip
      loading: false,
    };
  },
  computed: {
    btnword() {
      if (this.isName) {
        return '显示IP';
      }
      return '显示name';
    },
  },
  beforeDestory() {},
  methods: {
    // 过滤前端
    filterMethod(data, query) {
      return data.label.indexOf(query) > -1;
    },
    // 选择或者删除
    handleChange(newTargetKeys) {
      this.desData = newTargetKeys;
      if (newTargetKeys.length) {
        this.selectHost = this.hostList.filter(item => newTargetKeys.indexOf(item.id) > -1);
      } else {
        this.selectHost = [];
      }
    },
    // 获取主机列表
    getHostOfPro() {
      this.loading = true;
      getHostOfPro().then((res) => {
        if (res.status === 200) {
          this.hostList = JSON.parse(JSON.stringify(res.data.hosts));
          // this.sourceData = res.data.hosts.map((item) => {
          //   const host = JSON.parse(JSON.stringify(item));
          //   host.key = host.id;
          //   host.label = host.name || host.hostname;
          //   return host;
          // });
          this.showHostInfo(this.hostShowType, res.data.hosts);
        }
      });
    },
    // 获取组下主机列表
    getGroupHost(id) {
      getHostOfPro({
        group_id: id,
      }).then((res) => {
        if (res.status === 200) {
          this.selectHost = res.data.hosts;
          this.desData = res.data.hosts.map(item => item.id);
        } else {
          this.selectHost = [];
          this.desData = [];
        }
      });
    },
    changeShowName() {
      this.isName = !this.isName;
      if (this.isName) {
        this.showHostInfo('name', this.sourceData);
      } else {
        this.showHostInfo('ip', this.sourceData);
      }
    },
    // 设置展示ip还是name
    showHostInfo(type, arr) {
      this.hostShowType = type;
      if (type === 'name') {
        this.sourceData = arr.map((item) => {
          const host = JSON.parse(JSON.stringify(item));
          host.key = host.id;
          host.label = host.name || host.hostname;
          return host;
        });
      } else if (type === 'ip') {
        this.sourceData = arr.map((item) => {
          const host = JSON.parse(JSON.stringify(item));
          host.key = host.id;
          host.label = host.ip;
          return host;
        });
      }
      this.loading = false;
    },
    // 取消弹窗
    cancel() {
      this.showModal = false;
      this.selectHost = [];
      this.desData = [];
    },
    // 弹窗确认
    confirmSave() {
      this.$refs.nameForm.validate((valid) => {
        if (valid) {
          if (this.selectHost.length) {
            this.showModal = false;
            if (this.isEdit) {
              this.updateGroups();
            } else {
              this.addGroups();
            }
          } else {
            this.$Message.warning('请选择主机');
          }
        }
      });
    },
    // 创建主机组
    addGroups() {
      // addGroups({
      //   hosts: this.selectHost,
      // }).then((res) => {
      //   if (res.status === 200) {
      //     // 添加成功后触发回调
      //     this.$emit('on-devrelease', 'buildgroup', res.data.group.id);
      //     this.showModal = false;
      //   }
      // });
    },
    // 编辑主机组
    updateGroups() {
      // updateGroups({
      //   id: this.groupId,
      //   hosts: this.selectHost,
      // }).then((res) => {
      //   if (res.status === 200) {
      //     // 添加成功后触发回调
      //     this.$emit('on-devrelease', 'editgroup', this.groupId);
      //     this.showModal = false;
      //   }
      // });
    },
    // 创建组
    createInit() {
      this.selectHost = [];
      this.desData = [];
      this.isEdit = false;
      this.showModal = true;
      this.getHostOfPro();
    },
    // 编辑组
    editInit(group) {
      this.groupId = group.id;
      this.isEdit = true;
      this.showModal = true;
      this.getGroupHost(this.groupId);
      this.getHostOfPro();
    },
  },
  mounted() {},
};

</script>
<style scoped lang="scss">
  
  .select-transfer {
    text-align: center;
    /*padding: 0 20px;*/
    /*display: inline-block;
    margin: 0 auto;*/
    .ivu-transfer {
      text-align: start;
      display: inline-block;
    }
  }
</style>