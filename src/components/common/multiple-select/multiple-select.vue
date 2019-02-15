<style lang="scss">
  @import "./multiple-select.scss";
</style>
<template>
  <div class="multiple-select" :id="selectId">
    <Dropdown trigger="custom" :visible="visible" placement="bottom-start" :transfer="transfer" :ref="selectId">
      <div class="seclect-main">
        <div class="clearfix search-content" :class="{'disabled': disableStatus}">
          <div class="selectd-list" v-for="(item, index) in selectedArr" ref="selectedList" :key="index">
            <Tag :key="index" :name="item" closable @on-close="removeTag(index)">
              <span class="show-key-value">{{ item }}</span>
            </Tag>
          </div>
          <div class="type-area" ref="search" :style="inputStyle" v-clickoutside="outside">
            <input ref="valueInput" :disabled="disableStatus" @click="toggleMenu" @keyup.enter="enterKeyUp" @input="searchChange" @keydown.delete="deleteSelect" v-model="searchName" class="ms-input" :placeholder="placeholder">
          </div>
        </div>
      </div>
      <DropdownMenu class="key-dropdown" :style="downStyle" slot="list">
        <div class="key-dropdown-list" v-if="dataShowList.length > 0">
          <DropdownItem v-for="(item, index) in dataShowList" @click.native="selectMenuItem(item, $event)"
          :key="index" :name="item">
            {{item}}
          </DropdownItem>
        </div>
        <div class="key-dropdown-list" v-else>
          <p class="pl-10">未找到匹配项</p>
        </div>
      </DropdownMenu>
    </Dropdown>
  </div>
</template>
<script>
import _ from 'lodash';
import clickoutside from '../../../directives/clickoutside';

export default {
  name: 'multipleSelect',
  directives: {
    clickoutside,
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    // 搜索下拉列表
    dataList: {
      type: Array,
      default: () => [],
    },
    // 搜索框唯一标识,id必填且要唯一
    selectId: {
      type: String,
      default: 'select_mul_op',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    transfer: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '输入进行筛选',
    },
  },
  data() {
    return {
      selectedArr: this.value, // 已经选择的数据
      visible: false, // 控制搜索下拉框的可见隐藏
      inputLength: 0, // 输入框长度
      lengthAll: 200, // 全部长度
      searchName: '', // 搜索框输入
    };
  },
  watch: {
    value(val) {
      if (val.length) {
        this.selectedArr = [...val];
      } else {
        this.selectedArr = [];
      }
    },
  },
  methods: {
    init() {
      this.selectedArr = [];
    },
    // 展示关闭下拉框
    toggleMenu() {
      this.visible = !this.visible;
    },
    // 开启下拉框
    handleOpen() {
      this.visible = true;
    },
    // 关闭下拉框
    handleClose() {
      this.visible = false;
    },
    // 点击下拉菜单事件，选择对应选项
    selectMenuItem(name, event) {
      event.stopPropagation(); // 阻止默认的关闭事件
      this.selectedArr.push(name);
      this.$emit('on-change', this.selectedArr);
      this.$nextTick(() => {
        this.setInputLength();
      });
    },
    // 回车选中第一个
    enterKeyUp() {
      const selectedValue = this.searchName.trim();
      if (this.searchName !== '' && selectedValue !== '' && this.dataShowList.length > 0) {
        this.selectedArr.push(this.dataShowList[0]);
        this.$emit('on-change', this.selectedArr);
        this.$nextTick(() => {
          this.setInputLength();
        });
      }
    },
    // 删除选项
    removeTag(index) {
      if (!this.disableStatus) {
        this.selectedArr.splice(index, 1);
        this.$emit('on-change', this.selectedArr);
        this.$nextTick(() => {
          this.setInputLength();
        });
      }
    },
    // 用于当输入框为空时，删除搜索项
    deleteSelect() {
      if (this.searchName.length === 0 && this.selectedArr.length > 0) {
        this.removeTag(this.selectedArr.length - 1);
      }
    },
    // 监听输入事件,搜索时将下拉框打开并计算位置
    // eslint-disable-next-line
    searchChange: _.debounce(function() {
      this.handleOpen();
      // 更新dropdown下拉框的位置
      if (this.$refs[this.selectId].$refs.drop) {
        this.$refs[this.selectId].$refs.drop.update();
      }
    }, 500),
    // 点击搜索框外部,隐藏下拉框
    outside() {
      this.handleClose();
    },
    // 设置搜索框长度
    setInputLength() {
      const parentEle = document.getElementById(this.selectId);
      const lengthAll = parentEle.getElementsByClassName('search-content')[0].offsetWidth;
      this.lengthAll = lengthAll; // 设置下拉列表的长度
      const selectList = [].slice.call(parentEle.getElementsByClassName('selectd-list')); // 所有选中项
      let offsetLeft = 0; // input左侧距离
      selectList.forEach((ele) => {
        offsetLeft += (ele.offsetWidth + 6);
        // 当换行时将长度重置
        if (lengthAll <= offsetLeft) {
          offsetLeft = ele.offsetWidth + 6;
        }
      });
      if (offsetLeft > 0) {
        this.inputLength = Math.floor(lengthAll - offsetLeft);
      } else {
        this.inputLength = 0;
      }
      // 每次设置长度时，更新dropdown下拉框的位置
      if (this.$refs[this.selectId].$refs.drop) {
        this.$refs[this.selectId].$refs.drop.update();
      }
    },
    // 外部初始化
    setData(arr) {
      this.selectedArr = arr;
      this.$emit('on-change', this.selectedArr);
      this.$nextTick(() => {
        this.setInputLength(); // 计算搜索框input长度
      });
    },
  },
  computed: {
    // 禁止再次进行选择
    disableStatus() {
      return this.loading || this.disabled;
    },
    // 返回搜索框长度样式
    inputStyle() {
      const style = {};
      // 设置最小宽度为100
      if (this.inputLength > 100) {
        style.width = `${this.inputLength}px`;
      } else {
        style.width = '100%';
      }
      return style;
    },
    // 下拉框样式
    downStyle() {
      const style = {};
      // 设置最小宽度为100
      if (this.lengthAll > 200) {
        style.width = `${this.lengthAll}px`;
      } else {
        style.width = '200px';
      }
      return style;
    },
    // 输入时对搜索键进行过滤
    dataFilterList() {
      if (this.selectedArr.length === 0) {
        return this.dataList;
      }
      // 不在已选中的数组中，才展示
      return this.dataList.filter(item => this.selectedArr.indexOf(item) === -1);
    },
    // 前端搜索过滤展示list
    dataShowList() {
      const name = this.searchName.trim();
      if (this.searchName === '' || name === '') {
        return this.dataFilterList;
      }
      const regex = new RegExp(name, 'i');
      return this.dataFilterList.filter(item => regex.test(item));
    },
  },
  created() {
  },
  mounted() {
    this.setInputLength();
  },
  beforeDestroy() {
    this.searchName = '';
  },
};
</script>
