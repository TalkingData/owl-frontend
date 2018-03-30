<style lang="scss">
@import './group-sets.scss'

</style>
<template>
  <div class="group-sets">
    <Row type="flex" justify="start" align="middle">
      <div class="float-left mr-10 mb-10">主机组：</div>
      <div class="float-left mr-10 mb-10" v-for="(item, index) in showData" :key="index">
        <!-- <Button :type="(groupSelected === '' || item.id === groupSelected) ? 'primary' : 'ghost'" @click="checkGroup(item)">{{item.name}}</Button> -->
        <div class="set-item-block" @click.stop="checkGroup(item)" :class="!editAble && (groupSelected === '' || item.id === groupSelected) ? 'success' : 'failure'">
          <span class="set-item-block-word">{{item.name}}</span>
          <Icon type="ios-close-empty" size="14" @click.native.stop="removeData(index)" v-if="editAble"></Icon>
        </div>
      </div>
      <div class="float-left mr-10 mb-10" v-show="!editAble">
        <Button title="编辑" icon="edit" @click="startEdit"></Button>
      </div>
    </Row>
    <Row v-show="editAble" :gutter="16">
      <Col span="12">
        <Select multiple filterable v-model="addData" @on-change="selectGroup">
          <Option v-for="(item, index) in groupList" 
          :value="item.id" 
          :label="item.name"
          :key="index">{{item.name}}</Option>
        </Select>
      </Col>
      <Col span="12">
        <Button type="primary" @click="confirm">增加</Button>
        <Button @click="cancel">取消</Button>
      </Col>
    </Row>
  </div>
</template>
<script>
// import _ from 'lodash';
// import bus from '../../libs/bus';
// import Util from '../../libs/utils';

export default {
  name: 'groupSets',
  components: {
  },
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // showData: [], // 显示的数据
      // 主机组列表
      groupList: [],
      groupSelected: '',
      editAble: false,
      addData: [], // 选中要添加的数据
    };
  },
  methods: {
    // 选择组
    checkGroup(obj) {
      if (!this.editAble) {
        if (this.groupSelected === '') {
          this.groupSelected = obj.id;
        } else if (obj.id === this.groupSelected) {
          this.groupSelected = '';
        } else {
          this.groupSelected = obj.id;
        }
        let id = '';
        if (this.groupSelected === '') {
          id = 'all';
        } else {
          id = this.groupSelected;
        }
        this.$emit('on-click', id);
      } else {
        this.groupSelected = '';
      }
    },
    // 删除
    removeData(index) {
      this.$emit('on-remove-data', index);
    },
    // 开始编辑
    startEdit() {
      this.editAble = true;
    },
    // 选中组数据
    selectGroup() {
    },
    // 增加
    confirm() {
      this.editAble = false;
      if (this.addData.length === 0) {
        this.$Message.warning('请选择要添加的组');
      } else {
        // const arr = this.addData.map(item => item);
        const arr = this.groupList.filter(item => this.addData.indexOf(item.id) > -1);
        this.$emit('on-add-data', arr);
        this.addData = [];
      }
    },
    // 取消编辑
    cancel() {
      this.editAble = false;
      this.addData = [];
    },
  },
  computed: {
    // 显示的数据
    showData() {
      return this.data;
    },
  },
  mounted() {
    this.groupList = [];
  },
  watch: {
    // data() {
    //   this.showData = this.data;
    // },
  },
  beforeDestroy() {
  },
};

</script>
