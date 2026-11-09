/* ============================================
   主入口：初始化数据、注册路由、绑定搜索
============================================ */

(function () {
  // 1. 初始化本地数据（首次访问时写入预置数据）
  Storage.initIfEmpty();

  // 2. 初始化页面渲染器
  Pages.init();

  // 3. 注册路由
  Router.register('/', function () {
    Pages.home();
  });

  Router.register('/brands', function (params, query) {
    Pages.brandList(query);
  });

  Router.register('/brand/:brandId', function (params) {
    Pages.brandDetail(params);
  });

  Router.register('/brand/:brandId/model/:modelId', function (params) {
    Pages.modelDetail(params);
  });

  Router.register('/search', function (params, query) {
    Pages.search(query);
  });

  // 4. 绑定顶部搜索框
  function doSearch() {
    var kw = document.getElementById('search-input').value.trim();
    if (kw) {
      location.hash = '#/search?q=' + encodeURIComponent(kw);
    }
  }
  document.getElementById('search-btn').addEventListener('click', doSearch);
  document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  // 5. 启动路由
  Router.start();
})();
