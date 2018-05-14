<style lang="scss">
@import './template-list.scss'

</style>
<template>
  <div class="main-container template-list">
    <div class="main-list-content">
      <div class="common-detail-top">
        <div class="clearfix mb-10">
          <div class="float-left">
            <Button icon="minus" @click="removeData" :disabled="!disableObj.isRemove" type="primary">删除模板</Button>
            <Button type="primary" icon="plus" @click="createData">创建模板</Button>
          </div>
          <div class="float-right">
            <!-- <Checkbox v-model="isMyrule" @on-change="chaeckMy">我的模板</Checkbox> -->
            <Input style="width: 200px;" v-model="searchName" @on-change="search" placeholder="输入关键字检索"></Input>
            <Button @click="reload">
              <Icon size="18" type="refresh"></Icon>
            </Button>
          </div>
        </div>
      </div>
      <div class="rule-list table-list">
        <div class="box-content">
          <paging ref="page" :total="total" @on-page-info-change="pageInfoChange">
            <Table slot="listTable" size="small" border
              ref="tablelist"
              :data="dataList" 
              :columns="columns"
              no-data-text="暂无数据"
              @on-select-all="selectAll"
              @on-selection-change="selectItem"
              ></Table>
          </paging>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import bus from '../../libs/bus';
import { getTemplates, deleteTemplate } from '../../models/service';
import paging from '../../components/page/paging';

export default {
  name: 'alarmStrategy',
  components: {
    paging,
  },
  data() {
    return {
      saveDataList: [], // 作为备份的数据列表
      allDataList: [], // 所有数据列表
      dataList: [], // 数据列表
      searchName: '', //  搜索名称
      filterEnable: '', // 筛选条件
      filterStatus: '', // 状态筛选
      isMyrule: false,
      isRole: false,
      isAddStatus: false, // 是否是添加模式
      filter: { // 翻页
        page: 1,
        page_size: 10,
      },
      total: 0,
      selectedData: [], // 选中数据
      deleteIndex: -1,
      deleteObj: null,
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center',
        }, {
          title: '模板名称',
          key: 'name',
          render: (h, params) => h('a', {
            attrs: {
              title: '查看模板',
              // eslint-disable-next-line
              href: 'javascript:;',
            },
            on: {
              click: () => {
                this.viewRule(params.row);
              },
            },
          }, params.row.name),
        }, {
          title: '描述',
          key: 'description',
        }, {
          title: '操作',
          align: 'right',
          render: (h, params) => h('div', [h('Tooltip', {
            props: {
              content: '编辑',
              placement: 'top',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'edit',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.editRule(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '克隆',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'ios-copy-outline',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.cloneRule(params.row);
              },
            },
          })]), h('Tooltip', {
            props: {
              content: '删除',
              placement: 'top',
            },
            style: {
              marginLeft: '10px',
            },
          }, [h('Icon', {
            props: {
              size: 18,
              type: 'trash-a',
            },
            nativeOn: {
              click: (event) => {
                event.stopPropagation();
                this.deleteRule(params.row);
              },
            },
          })])]),
        },
      ],
    };
  },
  computed: {
    disableObj() { // 操作可执行
      if (this.selectedData.length) {
        return {
          isRemove: true,
          isEnable: true,
          isDisable: true,
        };
      }
      return {
        isRemove: false,
        isEnable: false,
        isDisable: false,
      };
    },
  },
  methods: {
    // 新建模板
    createData() {
      this.$router.push({
        path: '/admin/template/create',
      });
    },
    // eslint-disable-next-line
    search: _.debounce(function() {
      this.initFilter();
      this.filter.query = this.searchName;
      // this.getData(this.filter);
      if (this.searchName !== '') {
        this.allDataList = this.saveDataList.filter((item) => {
          const obj = item;
          return obj.name.indexOf(this.searchName) > -1 ||
           obj.description.indexOf(this.searchName) > -1;
        });
      } else {
        this.allDataList = this.saveDataList.map((item) => {
          const obj = Object.assign({}, item);
          return obj;
        });
      }
      this.total = this.allDataList.length;
      this.dataList = this.allDataList.slice(0, this.filter.page_size);
    }, 300), // 搜索
    // 全选
    selectAll(flag) {
      this.selectedData = flag;
    },
    // 单选
    selectItem(item) {
      this.selectedData = item;
    },
    // 排序
    handleSort(value) {
      const order = value.order === 'normal' ? '' : `${value.key}|${value.order}`;
      this.filter.order = order;
      this.initFilter();
    },
    // 翻页
    pageInfoChange(filter) {
      this.filter.page = filter.page;
      this.filter.page_size = filter.pageSize;
      // this.getData(this.filter);
      const start = (this.filter.page - 1) * this.filter.page_size;
      const end = this.filter.page * this.filter.page_size;
      this.dataList = this.allDataList.slice(start, end);
      this.selectedData = [];
    },
    chaeckMy(value) {
      if (value) {
        this.filter.my = true;
        this.initFilter();
      } else {
        delete this.filter.my;
        this.getData();
      }
    },
    // 初始化过滤条件
    initFilter() {
      this.$refs.page.init();
      this.filter.page = 1;
      // this.filter.page_size = 10;
    },
    // 刷新
    reload() {
      // this.searchName = '';
      // this.initFilter();
      this.getData();
    },
    // 获取数据
    getData() {
      this.selectedData = [];
      // const param = Object.assign({}, params);
      // if (param.query === '') delete param.query;
      getTemplates().then((res) => {
        if (res.status === 200 && res.data.templates) {
          this.saveDataList = res.data.templates;
          if (this.searchName !== '') {
            this.allDataList = this.saveDataList.filter((item) => {
              const obj = item;
              return obj.name.indexOf(this.searchName) > -1 ||
               obj.description.indexOf(this.searchName) > -1;
            });
          } else {
            this.allDataList = res.data.templates;
          }
          this.total = this.allDataList.length;
          const start = (this.filter.page - 1) * this.filter.page_size;
          const end = this.filter.page * this.filter.page_size;
          this.dataList = this.allDataList.slice(start, end);
        } else {
          this.total = 0;
          this.dataList = [];
          this.allDataList = [];
          this.saveDataList = [];
        }
      });
    },
    // 删除
    deleteTemplate(params) {
      deleteTemplate(params).then((res) => {
        if (res.status === 200) {
          this.$Message.success('已成功删除');
          this.getData();
        }
      });
    },
    // 模板操作----------------------------------------------------
    // 批量删除
    removeData() {
      if (this.selectedData.length) {
        let ids = '?';
        let names = '';
        this.selectedData.forEach((item, index) => {
          if (index === 0) {
            ids += `template_id=${item.id}`;
            names += item.name;
          } else {
            ids += `&template_id=${item.id}`;
            names += `, ${item.name}`;
          }
        });
        const params = {
          param: ids,
        };
        this.$Modal.confirm({
          title: '删除模板',
          content: `确定要删除模板：<span style="color: #2d8cf0;">${names}</span> 吗？`,
          onOk: () => {
            this.deleteTemplate(params);
          },
        });
      }
    },
    // 删除模板
    deleteRule(rule) {
      this.deleteObj = rule;
      const params = {
        param: `?template_id=${rule.id}`,
      };
      this.$Modal.confirm({
        title: '删除模板',
        content: `确定要删除模板：<span style="color: #2d8cf0;">${rule.name}</span> 吗？`,
        onOk: () => {
          this.deleteTemplate(params);
        },
      });
    },
    // 查看模板
    viewRule(rule) {
      this.$router.push({
        path: `/admin/template/detail/${rule.id}`,
      });
    },
    // 编辑模板
    editRule(rule) {
      this.$router.push({
        path: `/admin/template/edit/${rule.id}`,
      });
    },
    // 克隆模板
    cloneRule(rule) {
      this.$router.push({
        path: `/admin/template/clone/${rule.id}`,
      });
    },
    // 返回该页时情况
    backToSuccess() {
      if (bus.backtoRulelist) {
        const str = bus.backtoRulelist;
        this.$Message.success({
          content: str,
          duration: 3,
        });
        bus.backtoRulelist = '';
      }
    },
    rowClassName() {
      return 'cursor-ivu-row';
    },
  },
  mounted() {
    this.getData();
    this.backToSuccess();
  },
};

</script>
