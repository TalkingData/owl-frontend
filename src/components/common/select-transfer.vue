<style lang="scss">
  @import "./select-transfer.scss";
</style>
<template>
  <div class="select-transfer" :id="selectId">
    <div class="seclect-main">
      <div class="clearfix search-content" :class="{'disabled': disabled}">
        <div class="selectd-list" v-for="(item, index) in selectedArr" ref="selectedList" :key="index">
          <Tag :key="index" :name="item.value" closable @on-close="removeTag(index)">
            <span class="show-key-value">{{ item.title }} : {{ item.value }} </span>
            <Icon @click.native="resetTag($event, index)" title="重置搜索值" class="reset-btn" type="ios-undo"></Icon>
          </Tag>
        </div>
        <div class="selectd-list" v-if="visibleKey">
          <!-- closable @on-close="unselectKey" -->
          <Tag :name="selectedKey" closable @on-close="deleteCurrentKey">
            {{ selectedTitle }}：
          </Tag>
        </div>
        <div class="type-area" ref="search" :style="inputStyle" v-clickoutside="outside">
          <Dropdown trigger="custom" :visible="visible" placement="bottom-start" @on-click="selectMenuItem">
            <input ref="valueInput" :disabled="disabled" @click="toggleMenu" @keyup.enter="enterKeyUp" @input="searchChange" @keydown.delete="deleteSelect" v-model="searchName" class="ms-input" :placeholder="placeholderInput">
            <DropdownMenu class="key-dropdown" slot="list" v-if="!visibleKey">
              <div class="key-dropdown-search">
                <Input v-model="filterName" 
                style="width: 100px;"
                placeholder="搜索下拉选项"></Input>
              </div>
              <div class="key-dropdown-list">
                <DropdownItem v-for="(item, index) in showKeyList" 
                :key="item.key" :name="item.key">
                  {{item.title}}
                </DropdownItem>
              </div>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import _ from 'lodash';
// import bus from '../../../libs/bus';
import clickoutside from '../../../directives/clickoutside';

export default {
  name: 'selectTransfer',
  directives: {
    clickoutside,
  },
  props: {
    limit: {
      type: Number,
      default: 3,
    },
    // 搜索键下拉框
    keyList: {
      type: Array,
      default: () => [],
    },
    // 搜索框唯一标识,id
    selectId: {
      type: String,
      default: 'se_mul_tag',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // 不展示的搜索键
    invisibleKey: {
      type: Array,
      default: () => ['operate_column'],
    },
  },
  data() {
    return {
      // 搜索条件集合数组[{key:value}]
      selectedArr: [],
      // 控制搜索键下拉框的可见隐藏
      visible: false,
      // 是否展示搜索框内容
      visibleKey: false,
      // 输入框长度
      InputLength: 0,
      // 搜索框输入
      searchName: '',
      // 记录当前的搜索键
      selectedKey: '',
      // 记录当前的搜索键名称
      selectedTitle: '',
      // 记录当前的搜索值
      selectedValue: '',
      // 筛选搜索键
      filterName: '',
    };
  },
  watch: {
  },
  methods: {
    init() {
      this.selectedArr = [];
    },
    // 展示关闭搜索键下拉框
    toggleMenu() {
      this.visible = !this.visible;
    },
    // 开启下拉框
    handleOpen() {
      this.visible = true;
    },
    // 关闭下拉框
    handleClose() {
      this.filterName = '';
      this.visible = false;
    },
    // 点击搜索键下拉菜单事件
    selectMenuItem(name) {
      const obj = this.keyList.find(item => item.key === name);
      if (obj) {
        this.selectedTitle = obj.title;
        this.selectedKey = obj.key;
        this.visibleKey = true; // 将key下拉设置为默认显示
        this.handleClose();
        this.$nextTick(() => {
          this.setInputLength();
        });
        // 选择键以后将光标移入输入框
        this.$refs.valueInput.focus();
      }
    },
    // 不显示搜索键
    unselectKey() {
    },
    // 初始化选项
    initSelected() {
      // 恢复初始化
      this.searchName = '';
      this.selectedKey = '';
      this.selectedTitle = '';
      this.selectedValue = '';
      // 重置下拉搜索
      this.filterName = '';
    },
    // 回车选中,将搜索条件传递并搜索
    enterKeyUp() {
      if (this.visibleKey) {
        if (this.searchName !== '' && this.selectedValue !== '') {
          this.selectedArr.push({
            key: this.selectedKey,
            title: this.selectedTitle,
            value: this.selectedValue,
          });
          this.$emit('on-change', this.selectedArr);
          this.initSelected();
          this.handleClose();
          // 每次回车都改变为默认显示key下拉
          this.visibleKey = false;
          // 计算搜索框input长度
          this.$nextTick(() => {
            this.setInputLength();
            // 回车后默认将下拉框弹出
            // if (this.limit > this.selectedArr.length) {
            //   this.toggleMenu();
            // }
          });
        }
      } else {
        this.$Message.warning({
          content: '请先选择要搜索的关键字，再输入搜索值',
          duration: 3,
        });
      }
    },
    // 删除选项
    removeTag(index) {
      this.visible = false;
      if (!this.loading) {
        this.selectedArr.splice(index, 1);
        this.$emit('on-change', this.selectedArr);
        this.$nextTick(() => {
          this.setInputLength();
        });
        // 删除以后将光标移入输入框
        this.$refs.valueInput.focus();
      }
    },
    resetTag(event, index) {
      event.stopPropagation();
      this.visible = false;
      if (!this.loading) {
        const obj = this.selectedArr[index];
        this.selectedArr.splice(index, 1);
        this.$emit('on-change', this.selectedArr);
        // test
        this.selectedTitle = obj.title;
        this.selectedKey = obj.key;
        this.visibleKey = true; // 将key下拉设置为默认显示
        // test end
        this.$nextTick(() => {
          this.setInputLength();
        });
        // 删除以后将光标移入输入框
        this.$refs.valueInput.focus();
      }
    },
    // 删除当前选择的键
    deleteCurrentKey() {
      if (this.visibleKey) {
        // 当删除选择键的时候将下拉框带出,软删除
        this.visibleKey = false;
        this.visible = true;
        // this.initSelected();
      }
    },
    // 用于当输入框为空时，删除搜索项
    deleteSelect() {
      if (this.searchName.length === 0) {
        if (this.visibleKey) {
          // 当删除选择键的时候将下拉框带出,软删除
          this.visibleKey = false;
          this.visible = true;
          // this.initSelected();
        } else if (this.selectedArr.length > 0) {
          this.removeTag(this.selectedArr.length - 1);
        }
      }
    },
    // 外部搜索条件触发,小心死循环
    searchByOther(key, name) {
      this.selectedArr.push({
        label: key,
        value: name,
      });
      this.$nextTick(() => {
        this.setInputLength();
      });
      this.$emit('on-change', this.selectedArr);
    },
    // 监听输入事件,去掉前后空格
    searchChange() {
      this.selectedValue = this.searchName.trim();
    },
    // 点击搜索框外部,隐藏搜索键下拉框
    outside() {
      this.handleClose();
    },
    // 设置搜索框长度
    setInputLength() {
      const parentEle = document.getElementById(this.selectId);
      const lengthAll = parentEle.getElementsByClassName('search-content')[0].offsetWidth;
      const selectList = [].slice.call(parentEle.getElementsByClassName('selectd-list'));
      let offsetLeft = 0;
      selectList.forEach((ele) => {
        offsetLeft += (ele.offsetWidth + 20);
        if (lengthAll <= offsetLeft) {
          offsetLeft = ele.offsetWidth + 20;
        }
      });
      if (offsetLeft > 0) {
        this.InputLength = Math.floor(lengthAll - offsetLeft - 25);
      } else {
        this.InputLength = 0;
      }
    },
  },
  computed: {
    // 当已选择项大于limit时，禁止再次进行选择
    disabled() {
      return this.loading || this.limit <= this.selectedArr.length;
    },
    // 返回搜索框长度样式
    inputStyle() {
      const style = {};
      // 设置最小宽度为100
      if (this.InputLength > 100) {
        style.width = `${this.InputLength}px`;
      } else {
        style.width = '100%';
      }
      return style;
    },
    // 输入时对搜索键进行过滤
    keyFilterList() {
      // const regex = new RegExp(this.searchName, 'i');
      if (this.selectedArr.length === 0) {
        return this.keyList.filter(item => this.invisibleKey.indexOf(item.key) === -1);
      }
      const arr = this.keyList.filter((item) => {
        // 不在已选中的数组中，也不在不显示数组中，才展示
        const obj = this.selectedArr.find(s => s.key === item.key ||
        this.invisibleKey.indexOf(item.key) > -1);
        return !obj;
      });
      return arr;
    },
    // 前端搜索过滤展示keylist
    showKeyList() {
      if (this.filterName === '') {
        return this.keyFilterList;
      }
      const regex = new RegExp(this.filterName, 'i');
      const arr = this.keyFilterList.filter(item =>
        regex.test(item.key) || regex.test(item.title));
      return arr;
    },
    placeholderInput() {
      if (this.selectedArr.length >= this.limit) {
        return `最多选择${this.limit}个搜索项`;
      }
      if (this.visibleKey) {
        return '请输入要搜索的内容值';
      }
      return '请选择要搜索的内容项';
    },
  },
  created() {
  },
  mounted() {
  },
  beforeDestroy() {
  },
};
</script>
