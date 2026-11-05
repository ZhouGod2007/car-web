/* ============================================
   极简 Hash 路由
   路由规则：
     #/                                首页
     #/brands                          品牌列表
     #/brand/:brandId                  品牌详情
     #/brand/:brandId/model/:modelId   车型详情
     #/search?q=关键词                 搜索结果
============================================ */

const Router = {
  handlers: {},
  currentRoute: null,

  /** 注册路由 */
  register(pattern, handler) {
    this.handlers[pattern] = handler;
  },

  /** 解析 hash 返回 { path, params, query } */
  parse() {
    let hash = location.hash.replace(/^#/, '');
    if (!hash) hash = '/';

    // 分离 query string
    let query = {};
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      const qs = hash.substring(qIdx + 1);
      hash = hash.substring(0, qIdx);
      qs.split('&').forEach(kv => {
        const [k, v] = kv.split('=');
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    return { path: hash, query };
  },

  /** 尝试匹配 path 到某个注册的 pattern */
  match(path) {
    for (const [pattern, handler] of Object.entries(this.handlers)) {
      // 将 pattern 中的 :param 替换为正则捕获组
      const regexStr = '^' + pattern.replace(/:([a-zA-Z_]+)/g, '([^/]+)') + '$';
      const regex = new RegExp(regexStr);
      const match = path.match(regex);
      if (match) {
        // 从 pattern 中提取参数名
        const paramNames = (pattern.match(/:([a-zA-Z_]+)/g) || []).map(s => s.substring(1));
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { handler, params };
      }
    }
    return null;
  },

  /** 启动路由监听 */
  start() {
    const run = () => this.navigate();
    window.addEventListener('hashchange', run);
    window.addEventListener('load', run);
    // 如果是直接打开 index.html（没有 hash），触发一次
    if (!location.hash) location.hash = '#/';
    run();
  },

  navigate() {
    const { path, query } = this.parse();
    const match = this.match(path);
    if (match) {
      this.currentRoute = { path, params: match.params, query };
      match.handler(match.params, query);
    } else {
      // 未匹配到路由，跳到首页
      location.hash = '#/';
    }
  },
};
