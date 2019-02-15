<style lang="scss">
@import './build-step2.scss';

</style>
<template>
  <div class="build-step">
    <Form :model="groupHost" ref="groupHost">
      <Row>
        <Col span="12" class="pr-10">
          <div class="mb-10">
            <span class="span-title">选择主机组</span>
          </div>
          <FormItem prop="desGroups" :rules="{required: true, type: 'array', min: 1, trigger: 'change', message: '请选择主机组'}">
            <Select 
            v-model="groupHost.desGroups" 
            filterable 
            multiple 
            placeholder="请选择主机组" 
            :disabled="viewDisable"
            @on-change="selectGroup"
            @click.native="openGroup"
            @on-open-change="openGroup">
              <Option v-for="(item, index) in groupArr" :value="item.id" :key="index">{{ item.name }}</Option>
            </Select>
          </FormItem>
        </Col>
        <Col span="12" class="pl-10">
          <div class="mb-10">
            <span class="span-title">排除主机</span>
          </div>
          <FormItem prop="desHosts">
            <Select 
            @on-change="selectHost"
            v-model="groupHost.desHosts" 
            filterable 
            multiple 
            placeholder="选择需要排除的主机" 
            :disabled="viewDisable"
            :label="hostArrLabel"
            :loading="false"
            remote
            :remote-method="remoteSearch"
            loading-text="请选择tag"
            not-found-text="">
              <Option v-for="(item, index) in hostOptionList" :value="item.id" :label="item.hostname" :key="index">{{ item.hostname }}</Option>
            </Select>
          </FormItem>
        </Col>
      </Row>
    </Form>
  </div>
</template>
<script>
import axios from 'axios';
import _ from 'lodash';
// import bus from '../../../libs/bus';
import { getHostGroups, getHostOfGroup } from '../../../models/service';

export default {
  name: 'buildStep2',
  components: {
  },
  props: {
    // 查看状态下,不能编辑
    viewDisable: {
      type: Boolean,
      default: false,
    },
    strategyInfo: {
      type: Object,
      default: {
        name: '',
        priority: 1, // 告警级别
        alarm_count: 5, // 告警次数
        cycle: 5, // 追溯时间
        logic: 'OR', // 逻辑关系
        expression: 'A', // 自定义
        triggers: [], // 对应模块ruleBlock
        groups: [],
        exclude_hosts: [], // 排除主机
      },
    },
  },
  data() {
    return {
      productId: '',
      groupArr: [], // 主机组
      desGroups: [], // 已选
      listStyle: {
        // width: '280px',
        height: '300px',
      },
      hostArr: [], // 待选主机,排除列
      timeTest: null,
      // 目标数据
      groupHost: {
        desGroups: [],
        desHosts: [],
      },
      hostArrLabel: [], // 主机展示label
      hostOptionList: [], // 主机组展示部分
    };
  },
  methods: {
    // 验证，并将数据返回
    vertifyStep() {
      this.$refs.groupHost.validate((valid) => {
        if (valid) {
          this.strategyInfo.groups = this.groupHost.desGroups.map((item) => {
            const obj = {
              group_id: item,
            };
            return obj;
          });
          this.strategyInfo.exclude_hosts = this.groupHost.desHosts.map((item) => {
            const obj = {
              id: item,
            };
            return obj;
          });
          this.$emit('on-vertify-success', this.strategyInfo, 'step2');
        }
      });
    },
    selectGroup(arr) {
      if (arr.length > 0) {
        const hostApi = [];
        arr.forEach((item) => {
          hostApi.push(getHostOfGroup({
            groupId: item,
            paging: false,
            productId: this.productId,
          }));
        });
        // 获取数据
        this.getHost(hostApi);
      }
    },
    selectHost() {
    },
    // 获取后台数据并展示，父级调用
    setDataList() {
      this.groupHost.desGroups = this.strategyInfo.groups.map(item => item.id);
      this.groupHost.desHosts = this.strategyInfo.exclude_hosts.map(item => item.id);
      // 默认显示
      this.hostArrLabel = this.strategyInfo.exclude_hosts.map(item => item.hostname);
    },
    // 获取主机组
    getHostGroups(product, msg) {
      getHostGroups({
        paging: false,
        productId: product,
      }).then((res) => {
        if (res.status === 200) {
          this.groupArr = res.data.host_groups;
          if (msg && msg === 'open') {
            const arr = this.groupHost.desGroups.filter((idItem) => {
              const obj = this.groupArr.find(item => idItem === item.id);
              return !!obj;
            });
            this.groupHost.desGroups = arr;
          }
        }
      });
    },
    openGroup(val) {
      if (val) {
        this.getHostGroups(this.productId, 'open');
      }
    },
    // 获取主机列表
    getHost(params) {
      this.hostArr = [];
      this.hostOptionList = [];
      axios.all(params).then((res) => {
        if (res.length === params.length) {
          let outerHost = [];
          res.forEach((item) => {
            if (item.status === 200) {
              const tempArr = item.data.hosts;
              outerHost = [...outerHost, ...tempArr];
            }
          });
          outerHost.forEach((host) => {
            const tempHost = this.hostArr.findIndex(value => host.id === value.id);
            if (tempHost === -1) {
              this.hostArr.push(host);
              this.hostOptionList.push(host);
            }
          });
        }
      });
    },
    // 远程搜索
    // eslint-disable-next-line
    remoteSearch: _.debounce(function(query) {
      if (query !== '') {
        this.hostOptionList = this.hostArr.filter(item =>
          item.hostname.toLowerCase().indexOf(query.toLowerCase()) > -1);
      } else {
        this.hostOptionList = this.hostArr.map(item => item);
      }
    }, 300),
  },
  computed: {
  },
  watch: {
  },
  mounted() {
    if (this.$route.params.productId) {
      this.productId = parseInt(this.$route.params.productId, 10);
    }
    this.getHostGroups(this.productId, 'default');
  },
  beforeDestroy() {},
};

</script>
