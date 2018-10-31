<template>
  <div>
    <Modal :width="720" v-model="showModal" :title="modalTitle" :mask-closable="false" @on-cancel="cancel">
      <Form ref="nameForm" :model="pluginInfo" :label-width="80">
        <FormItem prop="id" label="插件" :rules="{ required: true, type: 'number', message: '插件名不能为空', trigger: 'change'}">
          <Select ref="pluginSelect" v-model="pluginInfo.id"
          filterable 
          remote
          not-found-text=""
          placeholder="请输入插件名"
          :label="pluginName"
          :disabled="isEdit"
          @on-change="selectPlugin">
            <Option v-for="item in dataList"
            :key="item.id"
            :value="item.id"
            :label="item.name"
            >{{item.name}}</Option>
          </Select>
        </FormItem>
        <FormItem prop="args" label="执行参数">
          <Input v-model="pluginInfo.args" placeholder="请输入执行参数"></Input>
        </FormItem>
        <FormItem prop="interval" label="执行间隔" :rules="{ required: true, type: 'number', message: '执行间隔不能为空', trigger: 'change'}">
          <InputNumber style="width: 180px;" :min="1" v-model="pluginInfo.interval" placeholder="请输入执行间隔"></InputNumber>
        </FormItem>
        <FormItem prop="timeout" label="超时时间" :rules="{ required: true, type: 'number', message: '超时时间不能为空', trigger: 'change'}">
          <InputNumber style="width: 180px;" :min="1" v-model="pluginInfo.timeout" placeholder="请输入超时时间"></InputNumber>
        </FormItem>
        <Alert type="warning" show-icon v-if="errorMsg">{{errorMsg}}</Alert>
      </Form>
      <div slot="footer">
        <Button @click="cancel">取消</Button>
        <Button type="primary" @click="confirmSave">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import _ from 'lodash';
// import bus from '../../libs/bus';
import {
  getAllPlugins,
  addPluginInGroup,
  updatePluginInGroup,
  addPluginOfHost,
  updatePluginOfHost,
} from '../../../models/service';
import paging from '../../page/paging';

export default {
  name: 'pluginEdit',
  props: {},
  components: {
    paging,
  },
  data() {
    return {
      groupInfo: {},
      productId: '', // 产品线id
      hostId: '', // 主机id
      showModal: false,
      // 插件信息
      pluginInfo: {
        id: '',
        args: '',
        interval: 60,
        timeout: 10,
        path: '',
      },
      savePlugin: {}, // 保存插件信息
      // 插件ID
      pluginId: 0,
      dataList: [], // 主机列表
      // 是否是编辑模式
      isEdit: false,
      msgInfo: '', // 操作方式
      errorMsg: '', // 错误提示信息
      showAllFlag: false,
      pluginName: '',
    };
  },
  computed: {
    modalTitle() {
      if (this.msgInfo === 'groupadd' || this.msgInfo === 'hostadd') {
        return '添加插件';
      }
      return '编辑插件';
    }, // 弹出框抬头
  },
  beforeDestory() {},
  methods: {
    // eslint-disable-next-line
    search: _.debounce(function() { // 输入框筛选
    }, 300),
    // 初始化创建
    initInfo() {
      this.pluginInfo = {
        id: '',
        args: '',
        interval: 60,
        timeout: 10,
        path: '',
      };
    },
    // 编辑与创建
    editInit(msg, group, proId, plugin) {
      if (this.$refs.nameForm) {
        this.$refs.nameForm.resetFields();
      }
      this.msgInfo = msg;
      this.errorMsg = '';
      if (msg === 'groupadd') { // 主机组添加插件
        this.groupInfo = group;
        this.productId = proId;
        this.initInfo();
        this.isEdit = false;
        this.getAllPlugins();
      } else if (msg === 'groupUpdate') { // 主机组修改插件
        this.groupInfo = group;
        this.productId = proId;
        this.savePlugin = Object.assign({}, plugin);
        this.dataList = [plugin];
        this.pluginId = plugin.id;
        this.isEdit = true;
        this.$nextTick(() => {
          this.pluginInfo = Object.assign({}, this.savePlugin);
          this.pluginName = this.savePlugin.name;
        });
      } else if (msg === 'hostadd') { // 主机添加插件
        this.hostId = proId; // 主机id
        this.initInfo();
        this.isEdit = false;
        this.getAllPlugins();
      } else if (msg === 'hostUpdate') { // 主机修改插件
        this.hostId = proId; // 主机id
        this.savePlugin = Object.assign({}, plugin);
        this.dataList = [plugin];
        this.pluginId = plugin.id;
        this.isEdit = true;
        this.$nextTick(() => {
          this.pluginInfo = Object.assign({}, this.savePlugin);
          this.pluginName = this.savePlugin.name;
        });
      }
      // this.getAllPlugins();
      this.showModal = true;
    },
    // 选择插件
    selectPlugin(id) {
      if (id) {
        const plugin = this.dataList.find(item => id === item.id);
        if (plugin) {
          if (this.msgInfo === 'groupadd' || this.msgInfo === 'hostadd') {
            this.pluginInfo.args = plugin.args;
            this.pluginInfo.interval = plugin.interval;
            this.pluginInfo.timeout = plugin.timeout;
            this.pluginInfo.path = plugin.path;
          }
        }
      }
    },
    // 取消弹窗
    cancel() {
      this.errorMsg = '';
      this.showModal = false;
      this.dataList = [];
      if (this.$refs.pluginSelect) {
        this.$refs.pluginSelect.reset();
      }
      this.initInfo();
      this.showAllFlag = false;
      if (this.$refs.nameForm) {
        this.$refs.nameForm.resetFields();
      }
    },
    // 弹窗确认
    confirmSave() {
      this.errorMsg = '';
      this.$refs.nameForm.validate((valid) => {
        if (valid) {
          const params = {
            id: this.pluginInfo.id,
            args: this.pluginInfo.args,
            interval: this.pluginInfo.interval,
            timeout: this.pluginInfo.timeout,
            path: this.pluginInfo.path,
          };
          if (this.msgInfo === 'groupadd') {
            this.addPluginInGroup(params); // 主机组添加主机
          } else if (this.msgInfo === 'groupUpdate') {
            this.updatePluginInGroup(params);
          } else if (this.msgInfo === 'hostadd') {
            this.addPluginOfHost(params);
          } else if (this.msgInfo === 'hostUpdate') {
            this.updatePluginOfHost(params);
          }
        }
      });
    },
    // 给主机组添加插件
    addPluginInGroup(params) {
      const param = Object.assign({}, params);
      param.productId = this.productId;
      param.groupId = this.groupInfo.id;
      addPluginInGroup(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            this.cancel();
            // this.showModal = false;
          } else {
            this.errorMsg = '请重试';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 主机添加插件
    addPluginOfHost(params) {
      const param = Object.assign({}, params);
      param.hostId = this.hostId;
      addPluginOfHost(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = '请重试';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 主机组修改插件
    updatePluginInGroup(params) {
      const param = Object.assign({}, params);
      param.productId = this.productId;
      param.groupId = this.groupInfo.id;
      updatePluginInGroup(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = '请重试';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 主机修改插件
    updatePluginOfHost(params) {
      const param = Object.assign({}, params);
      param.hostId = this.hostId;
      updatePluginOfHost(param).then((res) => {
        if (res.status === 200) {
          if (res.data.code === 200) {
            this.$emit('on-create-success', this.msgInfo, res.data);
            // this.showModal = false;
            this.cancel();
          } else {
            this.errorMsg = '请重试';
          }
        } else {
          this.errorMsg = res.data;
        }
      });
    },
    // 获取所有插件
    getAllPlugins() {
      getAllPlugins({
        paging: false,
      }).then((res) => {
        if (res.status === 200) {
          this.dataList = res.data.plugins;
        } else {
          this.dataList = [];
        }
      });
    },
  },
  mounted() {
  },
};

</script>
<style scoped lang="scss">
  .select-transfer {
    .ellipsis {
      font-size: 18px;
      font-weight: bold;
    }
  }
</style>