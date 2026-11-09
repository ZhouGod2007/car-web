/* ============================================
   各页面渲染逻辑
   所有函数都往 #app 里写 HTML
============================================ */

const Pages = {
  appEl: null,

  init() {
    this.appEl = document.getElementById('app');
  },

  /**
   * 通用图片盒子：优先显示 <img>，图片加载失败时自动隐藏 img 并显示 emoji 兜底。
   * @param {string} extraClass  额外 className（如 'big-icon', 'model-icon'）
   * @param {string} imgPath     图片路径（来自 data.js 的 logoImg / image 字段）
   * @param {string} fallbackEmoji  图片加载失败时的 emoji
   *
   * 逻辑：img 默认显示、emoji 默认隐藏。img 加载失败 → 隐藏 img、显示 emoji。
   */
  _imgBox(extraClass, imgPath, fallbackEmoji) {
    const hasImg = !!imgPath;
    return `
      <div class="${extraClass}">
        ${hasImg
          ? `<img src="${imgPath}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />`
          : ''}
        <span class="img-fallback" style="${hasImg ? 'display:none;' : ''}">${fallbackEmoji}</span>
      </div>
    `;
  },

  /* ========== 首页 ========== */
  home() {
    const brands = Storage.getBrands() || [];
    const totalModels = brands.reduce((sum, b) => sum + (b.models || []).length, 0);

    // 品牌主题 accent 色
    const accentMap = {
      'mercedes-benz': '#C0C0C0',
      'cadillac': '#8B0000',
      'dodge': '#E53935',
      'bmw': '#0066B1',
    };

    // 推荐品牌（取前4个）—— Chroma Grid 结构
    const featured = brands.slice(0, 4).map(b => {
      const accent = accentMap[b.id] || '#4f46e5';
      const hasImg = !!b.logoImg;
      const imgDiv = hasImg
        ? `<div class="chroma-image" style="background-image:url('${b.logoImg}');"></div>`
        : `<div class="chroma-fallback">${b.logoIcon || '🏢'}</div>`;
      return `
        <a class="chroma-card ${hasImg ? 'has-image' : 'no-image'}" href="#/brand/${b.id}"
           data-accent="${accent}">
          <!-- accent 顶部色条 -->
          <div class="chroma-accent" style="background:${accent};"></div>
          <!-- 光晕层 -->
          <div class="chroma-glow" style="background:${accent};"></div>
          <!-- 图片 / emoji -->
          ${imgDiv}
          <!-- 边框发光 -->
          <div class="chroma-border-glow" style="border-color:${accent};"></div>
          <!-- 底部信息 -->
          <div class="chroma-info">
            <h3>${b.name}</h3>
            <p>${b.country} · ${b.founded}年</p>
          </div>
        </a>
      `;
    }).join('');

    this.appEl.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <h1>🚗 汽车知识站</h1>
        <p>探索不同品牌的历史、设计与车型发展。${brands.length} 个品牌，${totalModels} 款车型，等你发现。</p>
        <a href="#/brands" class="btn">开始浏览品牌 →</a>
      </section>

      <!-- 推荐品牌 Chroma Grid -->
      <h2 class="section-title">🌟 精选品牌</h2>
      <section class="chroma-grid" id="featured-grid">${featured}</section>

    `;

    // 渲染后初始化 Chroma Grid 光效
    requestAnimationFrame(() => {
      const grid = document.getElementById('featured-grid');
      if (grid) ChromaGrid.init(grid, {
        radius: 280,
        softness: 0.65,
        grayscale: 1,
        dim: 0.35,
        glow: 0.6,
      });
    });
  },

  /* ========== 品牌列表页（带筛选） ========== */
  brandList(query = {}) {
    let brands = Storage.getBrands() || [];

    // 收集可选筛选值
    const countries = [...new Set(brands.map(b => b.country).filter(Boolean))].sort();
    const groups = [...new Set(brands.map(b => b.group).filter(Boolean))].sort();
    const eras = [
      { label: '1900年前', filter: b => b.founded < 1900 },
      { label: '1900-1950', filter: b => b.founded >= 1900 && b.founded < 1950 },
      { label: '1950年后', filter: b => b.founded >= 1950 },
    ];

    // 应用筛选
    if (query.country) brands = brands.filter(b => b.country === query.country);
    if (query.group) brands = brands.filter(b => b.group === query.group);
    if (query.era) {
      const era = eras.find(e => e.label === decodeURIComponent(query.era));
      if (era) brands = brands.filter(era.filter);
    }
    if (query.q) {
      const kw = query.q.toLowerCase();
      brands = brands.filter(b =>
        b.name.toLowerCase().includes(kw) ||
        (b.englishName || '').toLowerCase().includes(kw) ||
        b.models.some(m => m.name.toLowerCase().includes(kw) || (m.chineseName || '').includes(kw))
      );
    }

    const listHtml = brands.map(b => `
      <a class="card brand-card" href="#/brand/${b.id}">
        ${this._imgBox('brand-icon', b.logoImg, b.logoIcon || '🏢')}
        <div class="brand-info">
          <h3>${b.name}</h3>
          <div class="brand-meta">${b.country} · ${b.founded}年 · ${b.group}</div>
          <div class="brand-desc">${this._truncate(b.profile, 80)}</div>
          <div style="margin-top:8px;">
            <span class="tag">${b.models.length} 款车型</span>
          </div>
        </div>
      </a>
    `).join('');

    const emptyHtml = brands.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <p>没有找到匹配的品牌</p>
        <div style="margin-top:16px;"><a href="#/brands" class="btn">清除筛选</a></div>
      </div>
    ` : '';

    this.appEl.innerHTML = `
      <h2 class="section-title">🏢 品牌列表 ${query.q ? `<span style="font-size:14px;color:#666;font-weight:normal;">· 搜索 "${query.q}"</span>` : ''}</h2>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>国家：</label>
          <select onchange="Pages._applyFilter('country', this.value)">
            <option value="">全部</option>
            ${countries.map(c => `<option value="${c}" ${query.country === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>集团：</label>
          <select onchange="Pages._applyFilter('group', this.value)">
            <option value="">全部</option>
            ${groups.map(g => `<option value="${g}" ${query.group === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>创立年代：</label>
          <select onchange="Pages._applyFilter('era', this.value)">
            <option value="">全部</option>
            ${eras.map(e => `<option value="${encodeURIComponent(e.label)}" ${query.era === encodeURIComponent(e.label) ? 'selected' : ''}>${e.label}</option>`).join('')}
          </select>
        </div>
        ${query.q ? `<div class="filter-group"><a href="#/brands" class="btn-outline btn">清除搜索</a></div>` : ''}
      </div>

      <!-- 品牌卡片网格 -->
      <section class="brand-grid">${listHtml || emptyHtml}</section>
    `;
  },

  /** 筛选切换辅助方法（由 select 的 onchange 直接调用） */
  _applyFilter(key, value) {
    let targetHash = '#/brands';
    if (value) {
      targetHash += '?' + key + '=' + encodeURIComponent(value);
    }
    location.hash = targetHash;
  },

  /* ========== 品牌详情页 ========== */
  brandDetail(params) {
    const brand = Storage.getBrand(params.brandId);
    if (!brand) {
      this._showNotFound('品牌不存在');
      return;
    }

    // 车型卡片
    const modelCards = (brand.models || []).map(m => `
      <a class="card model-card" href="#/brand/${brand.id}/model/${m.id}">
        ${this._imgBox('model-icon', m.image, m.logoIcon || '🚗')}
        <h4>${m.chineseName || m.name}</h4>
        <div class="model-meta">
          ${m.type || ''}${m.yearStart ? ` · ${m.yearStart}${m.yearEnd ? '-' + m.yearEnd : '年至今'}` : ''}
        </div>
      </a>
    `).join('') || '<div class="empty">暂无车型</div>';

    this.appEl.innerHTML = `
      <!-- 面包屑 -->
      <div class="breadcrumb">
        <a href="#/">首页</a> &nbsp;/&nbsp;
        <a href="#/brands">品牌列表</a> &nbsp;/&nbsp;
        ${brand.name}
      </div>

      <!-- 品牌头部 -->
      <div class="brand-header">
        ${this._imgBox('big-icon brand-logo-big', brand.logoImg, brand.logoIcon || '🏢')}
        <div class="brand-title">
          <h1>${brand.name} <span style="color:#888;font-size:18px;font-weight:normal;">${brand.englishName || ''}</span></h1>
          <div class="meta-row">
            <span>🌍 ${brand.country || '—'}</span>
            <span>📅 创立于 ${brand.founded || '—'} 年</span>
            <span>🏛️ ${brand.group || '—'}</span>
          </div>
          ${brand.slogan ? `<div style="margin-top:8px;font-style:italic;color:#555;">"${brand.slogan}"</div>` : ''}
          ${brand.officialUrl ? `
            <div style="margin-top:14px;">
              ${brand.buyMode === 'notice'
                ? `<button type="button" class="star-border-wrap"
                     style="--sb-color:#ffffff;--sb-duration:4s;--sb-glow:0.6;"
                     onclick="Pages.showBuyNotice('${brand.id}')">
                     <span class="star-border-trail top"></span>
                     <span class="star-border-trail bottom"></span>
                     <span class="star-border-inner">🛒 点击购买</span>
                   </button>`
                : `<a class="star-border-wrap" href="${brand.officialUrl}" target="_blank" rel="noopener"
                     style="--sb-color:#ffffff;--sb-duration:4s;--sb-glow:0.6;">
                     <span class="star-border-trail top"></span>
                     <span class="star-border-trail bottom"></span>
                     <span class="star-border-inner">🛒 点击购买</span>
                   </a>`}
            </div>` : ''}
        </div>
      </div>

      <!-- 品牌简介 -->
      <div class="info-section">
        <h2>📖 品牌档案</h2>
        <p>${brand.profile || '暂无简介'}</p>
      </div>

      <!-- 标志与设计 -->
      ${brand.logoMeaning || brand.designPhilosophy ? `
      <div class="info-section">
        <h2>🎨 标志与设计</h2>
        ${brand.logoMeaning ? `<p><strong>车标含义：</strong>${brand.logoMeaning}</p>` : ''}
        ${brand.designPhilosophy ? `<p><strong>设计理念：</strong>${brand.designPhilosophy}</p>` : ''}
      </div>` : ''}

      <!-- 技术与特色 -->
      ${(brand.technology && brand.technology.length) || brand.specialty ? `
      <div class="info-section">
        <h2>⚙️ 技术与特色</h2>
        ${brand.specialty ? `<p><strong>擅长领域：</strong>${brand.specialty}</p>` : ''}
        ${brand.technology && brand.technology.length ? `
          <ul>${brand.technology.map(t => `<li>${t}</li>`).join('')}</ul>
        ` : ''}
      </div>` : ''}

      <!-- 发展历程/故事 -->
      ${brand.history && brand.history.length ? `
      <div class="info-section">
        <h2>📜 发展历程</h2>
        <ul>${brand.history.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>` : ''}

      <!-- 旗下车型 -->
      <div class="info-section">
        <h2>🚙 旗下车型（${brand.models ? brand.models.length : 0}）</h2>
        <div class="model-list" style="margin-top:12px;">${modelCards}</div>
      </div>
    `;
  },

  /* ========== 车型详情页 ========== */
  modelDetail(params) {
    const brand = Storage.getBrand(params.brandId);
    const model = Storage.getModel(params.brandId, params.modelId);

    if (!brand || !model) {
      this._showNotFound('车型不存在');
      return;
    }

    // 参数表格
    let specsHtml = '';
    if (model.specs && Object.keys(model.specs).length) {
      specsHtml = `
        <div class="info-section">
          <h2>📊 车型参数</h2>
          <div class="spec-grid">
            ${Object.entries(model.specs).map(([k, v]) => `
              <div class="spec-item">
                <div class="spec-label">${k}</div>
                <div class="spec-value">${v}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.appEl.innerHTML = `
      <!-- 面包屑 -->
      <div class="breadcrumb">
        <a href="#/">首页</a> &nbsp;/&nbsp;
        <a href="#/brands">品牌列表</a> &nbsp;/&nbsp;
        <a href="#/brand/${brand.id}">${brand.name}</a> &nbsp;/&nbsp;
        ${model.chineseName || model.name}
      </div>

      <!-- 车型头部 -->
      <div class="model-header">
        ${this._imgBox('big-icon model-img-big', model.image, model.logoIcon || '🚗')}
        <div class="model-title">
          <h1>${model.chineseName || model.name} <span style="color:#888;font-size:18px;font-weight:normal;">${model.chineseName ? model.name : ''}</span></h1>
          <div class="meta-row">
            <span>🏢 ${brand.name}</span>
            ${model.type ? `<span>🚘 ${model.type}</span>` : ''}
            ${model.yearStart ? `<span>📅 ${model.yearStart}${model.yearEnd ? ' - ' + model.yearEnd : ' 年至今'}</span>` : ''}
          </div>
          ${model.summary ? `<p style="color:#444;">${model.summary}</p>` : ''}
          <div style="margin-top:10px;">
            <a href="#/brand/${brand.id}" class="btn-outline btn">← 返回 ${brand.name} 品牌页</a>
          </div>
        </div>
      </div>

      ${specsHtml}

      ${model.evolution ? `
        <div class="info-section">
          <h2>🔄 车型演变</h2>
          <p>${model.evolution}</p>
        </div>
      ` : ''}
    `;
  },

  /* ========== 搜索结果页（独立路由） ========== */
  search(query = {}) {
    const kw = (query.q || '').trim();
    if (!kw) {
      location.hash = '#/brands';
      return;
    }

    const brands = Storage.getBrands() || [];
    const kwLower = kw.toLowerCase();

    // 搜品牌
    const matchedBrands = brands.filter(b =>
      b.name.toLowerCase().includes(kwLower) ||
      (b.englishName || '').toLowerCase().includes(kwLower)
    );

    // 搜车型（顺便带上品牌信息）
    const matchedModels = [];
    brands.forEach(b => {
      (b.models || []).forEach(m => {
        if (
          m.name.toLowerCase().includes(kwLower) ||
          (m.chineseName || '').includes(kw)
        ) {
          matchedModels.push({ ...m, brand: b });
        }
      });
    });

    const brandHtml = matchedBrands.map(b => `
      <a class="card brand-card" href="#/brand/${b.id}">
        ${this._imgBox('brand-icon', b.logoImg, b.logoIcon || '🏢')}
        <div class="brand-info">
          <h3>${b.name}</h3>
          <div class="brand-meta">${b.country} · ${b.founded}年</div>
        </div>
      </a>
    `).join('');

    const modelHtml = matchedModels.map(m => `
      <a class="card model-card" href="#/brand/${m.brand.id}/model/${m.id}">
        ${this._imgBox('model-icon', m.image, m.logoIcon || '🚗')}
        <h4>${m.chineseName || m.name}</h4>
        <div class="model-meta">${m.brand.name} · ${m.type || ''}</div>
      </a>
    `).join('');

    this.appEl.innerHTML = `
      <h2 class="section-title">🔍 搜索 "${kw}"</h2>

      ${brandHtml ? `
        <p style="margin-bottom:10px;color:#666;">找到 ${matchedBrands.length} 个品牌</p>
        <section class="brand-grid" style="margin-bottom:28px;">${brandHtml}</section>
      ` : ''}

      ${modelHtml ? `
        <p style="margin-bottom:10px;color:#666;">找到 ${matchedModels.length} 款车型</p>
        <div class="model-list" style="margin-bottom:28px;">${modelHtml}</div>
      ` : ''}

      ${!brandHtml && !modelHtml ? `
        <div class="empty">
          <div class="empty-icon">😕</div>
          <p>没有找到 "${kw}" 相关的品牌或车型</p>
          <div style="margin-top:16px;">
            <a href="#/brands" class="btn">浏览全部品牌</a>
          </div>
        </div>
      ` : ''}
    `;
  },

  /* ========== 购买提示弹窗 ========== */
  showBuyNotice(brandId) {
    const brand = Storage.getBrand(brandId);
    if (!brand) return;
    this.closeBuyNotice();

    const mask = document.createElement('div');
    mask.className = 'buy-modal-mask';
    mask.id = 'buy-modal';
    mask.innerHTML = `
      <div class="buy-modal" role="dialog" aria-modal="true">
        <div class="buy-modal-icon">🛒</div>
        <h3>购买提示</h3>
        <p>${brand.name}暂未开放在线购买通道，具体的车型配置与经销商信息请以官方渠道为准。</p>
        <div class="buy-modal-actions">
          <a class="btn" href="${brand.officialUrl}" target="_blank" rel="noopener">前往${brand.name}官网</a>
          <button type="button" class="btn btn-outline" onclick="Pages.closeBuyNotice()">知道了</button>
        </div>
      </div>
    `;
    mask.addEventListener('click', function (e) {
      if (e.target === mask) Pages.closeBuyNotice();
    });
    document.body.appendChild(mask);
    requestAnimationFrame(function () { mask.classList.add('show'); });
  },

  closeBuyNotice() {
    const mask = document.getElementById('buy-modal');
    if (!mask) return;
    mask.classList.remove('show');
    setTimeout(function () { mask.remove(); }, 200);
  },

  /* ========== 工具方法 ========== */
  _truncate(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
  },

  _showNotFound(msg) {
    this.appEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">❓</div>
        <p>${msg}</p>
        <div style="margin-top:16px;">
          <a href="#/" class="btn">返回首页</a>
          <a href="#/brands" class="btn btn-outline">浏览品牌列表</a>
        </div>
      </div>
    `;
  },
};
