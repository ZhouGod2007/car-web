/* ============================================
   Chroma Grid —— 聚光灯光效（原生 JS 实现）
   鼠标在网格内移动时，根据光标到每张卡片的距离：
   - 计算 grayscale / brightness / 光晕强度
   - 近距离卡片恢复彩色 + 更亮
   - 远距离卡片保持灰度 + 更暗
   ============================================ */

const ChromaGrid = {
  /**
   * 初始化一个 ChromaGrid
   * @param {HTMLElement} container   网格容器（需先渲染好 .chroma-card 子元素）
   * @param {Object} opts             配置
   *   radius     : 聚光灯影响半径（像素，默认 280）
   *   softness   : 边缘柔和度（0-1，默认 0.65，越大越柔）
   *   grayscale  : 最大灰度值（0-1，默认 1）
   *   dim        : 最暗亮度（0-1，默认 0.35）
   *   glow       : 光晕强度（0-1，默认 0.55）
   */
  init(container, opts = {}) {
    if (!container) return;

    const RADIUS    = opts.radius    ?? 280;
    const SOFTNESS  = opts.softness  ?? 0.65;
    const GRAYSCALE = opts.grayscale ?? 1;
    const DIM       = opts.dim       ?? 0.35;
    const GLOW      = opts.glow      ?? 0.55;

    const cards = container.querySelectorAll('.chroma-card');
    if (!cards.length) return;

    // 鼠标位置（相对 container）
    let mouse = { x: -9999, y: -9999 };
    let rafId = null;

    // 单次动画帧里更新所有卡片
    function tick() {
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2 - containerRect.left;
        const cy = rect.top  + rect.height / 2 - containerRect.top;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 距离 0 ~ RADIUS 映射成 1 ~ 0 的强度（用 smoothstep 让边缘更柔）
        let t = Math.max(0, 1 - dist / RADIUS);
        // softness 控制衰减形状：t^(1/softness) 越大越柔和
        t = Math.pow(t, 1 / Math.max(0.1, SOFTNESS));

        const hasImage = card.classList.contains('has-image');

        if (hasImage) {
          const img = card.querySelector('.chroma-image');
          // grayscale: 近距离→0（全彩）, 远距离→GRAYSCALE
          const g = GRAYSCALE * (1 - t);
          // brightness: 近距离→1.0（亮）, 远距离→DIM
          const b = DIM + (1 - DIM) * t;
          img.style.filter = `grayscale(${g.toFixed(3)}) brightness(${b.toFixed(3)})`;
        } else {
          // 没图的卡片只微调亮度
          const fb = card.querySelector('.chroma-fallback');
          if (fb) fb.style.filter = `brightness(${0.8 + 0.2 * t})`;
        }

        // 光晕层（用 accent 色做 blur 背景）
        const glowEl = card.querySelector('.chroma-glow');
        if (glowEl) {
          glowEl.style.opacity = (GLOW * t).toFixed(3);
        }

        // 边框发光
        const borderEl = card.querySelector('.chroma-border-glow');
        if (borderEl) {
          const accent = card.dataset.accent || 'rgba(255,255,255,0.5)';
          borderEl.style.boxShadow = `inset 0 0 0 ${(2 + 2 * t).toFixed(0)}px ${accent}`;
        }
      });
      rafId = null;
    }

    let containerRect = { left: 0, top: 0 };

    function onMouseMove(e) {
      containerRect = container.getBoundingClientRect();
      mouse.x = e.clientX - containerRect.left;
      mouse.y = e.clientY - containerRect.top;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function onMouseLeave() {
      mouse.x = -9999; mouse.y = -9999;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    // 初始 tick（确保首次渲染后滤镜正确）
    containerRect = container.getBoundingClientRect();
    tick();

    // 保存清理函数
    container._chromaCleanup = () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  },

  destroy(container) {
    if (container && container._chromaCleanup) container._chromaCleanup();
  },
};
