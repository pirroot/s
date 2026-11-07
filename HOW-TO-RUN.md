# How to run / راهنمای اجرا

## English

**Requirements:** Node.js 20+. No database needed — all content is static.

```bash
npm install
npm run dev          # →  http://localhost:3000
```

Production:

```bash
npm run build
npm run start        # →  http://localhost:3000
```

Pages (v4.3):

| Route | What it is |
| --- | --- |
| `/` | Interactive showroom hero (5 switch groups, cinematic intro) + values, products showcase (scroll-driven), in-situ, atelier |
| `/products` | The Collection — horizontal catalogue row (drag / swipe, More Details →) |
| `/products/[slug]` | Product detail — multi-photo gallery, specs, enquire, prev/next |
| `/about` | About & Contact combined — story, principles, enquiry form (mailto) |

Notes:
- Product photos / hero renders live in `assets-private/` (outside `public/`).
  They are served only through `/api/media/[id]` with a same-origin check and
  a burned-in watermark — there are no direct image URLs to download.
- To swap in new renders: replace the files 1:1 —
  hero `assets-private/hero/{d,m}-{base,l1..l5,allon}.jpg`,
  studio covers `assets-private/albums/p1..p5.jpg`,
  editorial set `assets-private/albums/a1..a6.jpg`,
  detail-page in-situ crops `assets-private/gallery/g-*.jpg`.
  No code changes needed.
- Site copy (brand, products, gallery captions, studio info) is static data in
  `src/data/site.ts` — the enquiry form composes a `mailto:` to `SITE.email`.
- The client's master renders in `upload/` are the source material; the site
  never ships them.

## فارسی

**پیش‌نیاز:** Node.js نسخه ۲۰ به بالا. نیازی به دیتابیس نیست — تمام
محتوا استاتیک است.

```bash
npm install
npm run dev        # → http://localhost:3000
```

اجرا در حالت production:

```bash
npm run build
npm run start
```

صفحه‌ها (نسخه v4.3):

| مسیر | توضیح |
| --- | --- |
| `/` | صفحه اول — شوروم تعاملی (۵ کلید نور)، معرفی محصولات با اسکرول، در-situ، آتلیه |
| `/products` | کلکسیون — ردیف افقی کاتالوگ (درگ/سوایپ + More Details) |
| `/products/[slug]` | صفحه هر محصول — گالری چند عکسی، مشخصات، استعلام، قبلی/بعدی |
| `/about` | درباره ما + تماس — داستان استودیو، اصول، فرم استعلام |

نکته‌ها:
- عکس‌های محصول/رندرهای هیرو در `assets-private/` هستند (بیرون از `public/`) و
  فقط از طریق `/api/media/[id]` با چک same-origin و واترمارک سرو می‌شوند.
- برای جای‌گذاری رندرهای جدید، فقط فایل‌ها را یک‌به‌یک عوض کنید — نیازی به
  تغییر کد نیست.
- محتوای سایت در `src/data/site.ts` است؛ فرم استعلام یک `mailto:` به
  `SITE.email` می‌سازد.
- رندرهای مرجع در `upload/` فقط ماده اولیه هستند و هرگز در سایت منتشر نمی‌شوند.
