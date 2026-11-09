/* =========================================================
   车志 Car Atlas — 本地服务器
   启动: npm start  →  浏览器打开 http://localhost:3000
   功能: 静态文件服务 + 图片上传接口
   ========================================================= */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'images');

// 确保 images 目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/* ---------- 静态文件 ---------- */
app.use(express.static(ROOT));
app.use('/images', express.static(IMAGES_DIR));

/* ---------- 图片上传 ---------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 允许前端通过 brand 和 model 参数组织子目录
    const brand = (req.body.brand || 'misc').replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase();
    const model = (req.body.model || '').replace(/[^a-zA-Z0-9\-_\u4e00-\u9fa5]/g, '');
    let dir = path.join(IMAGES_DIR, brand);
    if (model) dir = path.join(dir, model);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 40);
    const safeBase = base || 'img';
    const ts = Date.now().toString(36);
    cb(null, `${safeBase}-${ts}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const ok = /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i.test(file.mimetype);
    if (!ok) return cb(new Error('只支持图片文件 (png, jpg, gif, webp, bmp, svg)'));
    cb(null, true);
  }
});

app.post('/api/upload', upload.single('file'), function (req, res) {
  if (!req.file) return res.status(400).json({ error: '没有收到文件' });
  const rel = path.relative(IMAGES_DIR, req.file.path).replace(/\\/g, '/');
  res.json({ url: '/images/' + rel, name: req.file.originalname, size: req.file.size });
});

app.use('/api/upload', function (err, req, res, next) {
  res.status(400).json({ error: err.message });
});

/* ---------- 启动 ---------- */
app.listen(PORT, function () {
  console.log('');
  console.log('  车志 Car Atlas 已启动');
  console.log('  浏览器打开 →  http://localhost:' + PORT);
  console.log('  Ctrl+C 停止服务器');
  console.log('');
});
