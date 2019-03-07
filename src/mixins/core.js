import md5 from 'md5';

export default {
  data() {
    return {
      roleMd5: md5(1), // 1是管理员,0是普通用户
    };
  },
  created() {
    this.getInitPage();
  },
  methods: {
    setInitPage(num) {
      const pageInfo = localStorage.getItem('owl_page_info');
      const pageMap = pageInfo ? JSON.parse(pageInfo) : {};
      pageMap.console_panel_list = num;
      localStorage.setItem('owl_page_info', JSON.stringify(pageMap));
    },
    getInitPage() {
      const pageInfo = localStorage.getItem('owl_page_info');
      if (pageInfo) {
        const pageMap = JSON.parse(pageInfo);
        // const pageSize = pageMap.console_panel_list;
        const pageSize = pageMap.pageSize;
        if (pageSize) {
          this.filter.page_size = pageSize;
        }
      }
    },
  },
};
