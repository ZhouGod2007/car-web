/* ============================================
   localStorage 数据持久化
   - 首次访问：将 SEED_BRANDS 写入 localStorage
   - 后续访问：从 localStorage 读取用户数据
   - 使用 CarDB 命名空间，避免污染其他应用
============================================ */

const Storage = {
  KEY: 'CarDB_brands_v7',

  /** 获取所有品牌数据 */
  getBrands() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('读取本地数据失败:', e);
      return null;
    }
  },

  /** 保存所有品牌数据 */
  saveBrands(brands) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(brands));
      return true;
    } catch (e) {
      console.error('保存本地数据失败:', e);
      return false;
    }
  },

  /** 初始化：如果本地没有数据，用预置数据填充 */
  initIfEmpty() {
    const existing = this.getBrands();
    if (!existing) {
      this.saveBrands(SEED_BRANDS);
      console.log('📦 已从预置数据初始化，共 ' + SEED_BRANDS.length + ' 个品牌');
    }
  },

  /** 获取单个品牌 */
  getBrand(id) {
    const brands = this.getBrands() || [];
    return brands.find(b => b.id === id) || null;
  },

  /** 获取单个车型（brandId + modelId） */
  getModel(brandId, modelId) {
    const brand = this.getBrand(brandId);
    if (!brand) return null;
    return (brand.models || []).find(m => m.id === modelId) || null;
  },

  /** 重置为预置数据（调试用） */
  resetToSeed() {
    this.saveBrands(SEED_BRANDS);
  },
};
