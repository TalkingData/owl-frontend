export default {
  data() {
    return {
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
