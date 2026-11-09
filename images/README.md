# 📷 图片放置说明

把真实图片按以下规则放进 `images/` 目录，App 会自动显示。

## 目录结构

```
images/
├── mercedes-benz/          ← 奔驰
│   ├── logo.png            ← 奔驰车标（建议 400×400 透明底）
│   ├── s-class.jpg         ← S级
│   ├── c-class.jpg         ← C级
│   ├── g-class.jpg         ← G级
│   ├── 300-sl.jpg          ← 300 SL
│   └── eqs.jpg             ← EQS
├── cadillac/               ← 凯迪拉克
│   ├── logo.png
│   ├── ct6.jpg
│   ├── escala.jpg
│   ├── lyriq.jpg
│   ├── escalade.jpg
│   └── ats-v.jpg
└── dodge/                  ← 道奇
    ├── logo.png
    ├── challenger.jpg
    ├── charger.jpg
    ├── demon-170.jpg
    ├── durango.jpg
    └── hornet.jpg
```

## 图片格式

| 类型 | 推荐尺寸 | 格式 | 说明 |
|------|---------|------|------|
| 品牌车标 (logo.png) | 400 × 400 | PNG（透明底） | 正方形，居中裁剪 |
| 车型图片 (xxx.jpg) | 1200 × 800 | JPG / PNG | 横幅，车型居中 |

## 注意事项

1. **文件名必须完全匹配**，包括后缀（大小写敏感）
2. 品牌车标固定为 `logo.png`，车型图片固定为 `{modelId}.jpg`
3. 可以放 PNG 代替 JPG，只要文件名一样
4. 图片没放也不会报错，页面会自动显示 emoji 占位
5. 想加新品牌/新车型时，先在 `js/data.js` 里加数据，再把图片放到对应目录

## 添加新品牌图片

比如你加了宝马（id: `bmw`），需要：
1. 创建 `images/bmw/` 目录
2. 放入 `logo.png`
3. 每个车型放 `{modelId}.jpg`
