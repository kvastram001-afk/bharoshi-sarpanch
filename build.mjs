import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const config = JSON.parse(readFileSync('content.json', 'utf8'));
const pages = [
  ['index', 'होम'], ['about', 'परिचय'], ['vision', 'संकल्प'], ['plan', 'विकास योजना'],
  ['gallery', 'गैलरी'], ['updates', 'समाचार / अपडेट'], ['join', 'मेरे साथ जुड़ें'], ['contact', 'संपर्क']
];
const pending = 'जानकारी जोड़ी जानी बाकी है।';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const webUrl = value => /^https?:\/\/[^\s]+$/i.test(value ?? '') ? value : '';
const asset = value => /^assets\/[\w./ -]+$/i.test(value ?? '') && !value.includes('..') && existsSync(value) ? value : '';
const base = webUrl(config.siteUrl)?.replace(/\/+$/, '');
const phone = config.phone.replace(/[\s()-]/g, '');
const whatsapp = config.whatsapp.replace(/\D/g, '');
const callUrl = /^\+?\d{7,15}$/.test(phone) ? 'tel:' + phone : '';
const waUrl = /^\d{10,15}$/.test(whatsapp) ? 'https://wa.me/' + whatsapp : '';
const email = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(config.formEmail) ? config.formEmail : '';
const button = (label, url, style = '') => url
  ? `<a class="button ${style}" href="${escape(url)}">${escape(label)}</a>`
  : `<span class="button ${style}" aria-disabled="true" title="संपर्क विवरण जोड़ा जाना बाकी है">${escape(label)}</span>`;
const sources = (path, originalWidth = 1200) => [480, 800, originalWidth].map(width => {
  const file = width === originalWidth ? path : path.replace(/\.webp$/, '-' + width + '.webp');
  return asset(file) ? file + ' ' + width + 'w' : '';
}).filter(Boolean).join(', ');
const heroSizes = '(min-width: 700px) 334px, (min-width: 344px) 274px, calc(100vw - 70px)';
const gallerySizes = '(min-width: 1176px) 271px, (min-width: 900px) calc((100vw - 95px) / 4), (min-width: 700px) calc((100vw - 69px) / 2), calc((100vw - 42px) / 2)';
const gallerySliderSizes = '(min-width: 1176px) 271px, (min-width: 900px) 25vw, (min-width: 700px) 33vw, 76vw';
const photo = (path, alt, label, {width, height, sizes, eager = false, caption} = {}) => {
  if (!asset(path)) return `<div class="placeholder">${escape(label)}</div>`;
  const srcset = sizes && sources(path, width);
  return `<figure class="media"><img src="${escape(path)}" alt="${escape(alt)}" width="${width}" height="${height}" decoding="async"
  ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}${srcset ? ` srcset="${escape(srcset)}" sizes="${escape(sizes)}"` : ''}>
  ${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`;
};
const bioPhoto = photo(config.bioPhoto, config.bioPhotoAlt, 'परिचय की तस्वीर जोड़ी जानी बाकी है।',
  {width:900, height:900});
const section = (title, inner, extra = '') =>
  `<section class="section ${extra}"><div class="wrap"><h2>${escape(title)}</h2>${inner}</div></section>`;
const divider = '<div class="safa" aria-hidden="true"></div>';
const grid = (items, cols = 'sm:grid-cols-2') => `<div class="grid gap-4 ${cols}">${items.join('')}</div>`;
const panel = (title, detail) => `<article class="panel"><h3>${escape(title)}</h3><p class="muted">${escape(detail || pending)}</p></article>`;
const heading = title => `<div class="page-heading"><div class="wrap"><p class="eyebrow">${escape(config.place)}</p><h1>${escape(title)}</h1></div></div>`;
const links = current => pages.map(([slug, title]) =>
  `<a href="${slug}.html"${slug === current ? ' aria-current="page"' : ''}>${title}</a>`).join('');
const header = current => `<a class="skip button" href="#main">मुख्य सामग्री पर जाएँ</a>
<header class="header"><div class="wrap header-inner">
<details class="menu"><summary aria-label="मुख्य सूची"><svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></summary><nav aria-label="मुख्य नेविगेशन">${links(current)}</nav></details>
<a class="brand" href="index.html"><span>${escape(config.name)}</span><small>${escape(config.place)}</small></a>
<nav class="desktop-nav" aria-label="मुख्य नेविगेशन">${links(current)}</nav>
</div></header>
<div class="strip"><span aria-hidden="true">✦</span> ${escape(config.strip)} <span aria-hidden="true">✦</span></div>`;
const details = `<dl><div><dt>चुनाव चिह्न</dt><dd>${escape(config.symbol || 'पुष्टि बाकी है')}</dd></div>
<div><dt>मतदान की तारीख</dt><dd>${escape(config.pollingDate || 'पुष्टि बाकी है')}</dd></div>
<div><dt>फ़ोन / व्हाट्सऐप</dt><dd>${escape([callUrl && config.phone, waUrl && config.whatsapp].filter(Boolean).join(' / ') || 'विवरण जोड़ा जाना बाकी है')}</dd></div></dl>`;
const social = config.social.filter(item => webUrl(item.url)).map(item => button(item.label, item.url, 'light'));
const footer = `<footer class="footer"><div class="wrap"><strong>${escape(config.name)}</strong> · ${escape(config.place)}
${details}${social.length ? '<div class="actions">' + social.join('') + '</div>' : '<p class="hint">सोशल मीडिया लिंक जोड़े जाने बाकी हैं।</p>'}
</div></footer>
<aside class="sticky" aria-label="त्वरित संपर्क">${button('व्हाट्सऐप पर जुड़ें', waUrl)}${button('कॉल करें', callUrl, 'gold')}</aside>`;
const appeal = `<section class="appeal"><div class="wrap"><h2>${escape(config.appeal)}</h2><p>${escape(config.closing)}</p></div></section>`;

const video = (asset(config.reel.file)
  ? `<video class="reel" width="1080" height="1920" controls playsinline preload="none"${asset(config.reel.poster) ? ' poster="' + escape(config.reel.poster) + '"' : ''} aria-label="तीस सेकंड की मतदान अपील">
<source src="${escape(config.reel.file)}" type="video/mp4">${asset(config.reel.captions) ? `<track kind="captions" srclang="hi" label="हिंदी" src="${escape(config.reel.captions)}" default>` : ''}</video>`
  : `<div class="reel">${photo(config.reel.poster, config.reel.posterAlt, '३० सेकंड का वीडियो और हिंदी उपशीर्षक जोड़े जाने बाकी हैं।',
      {width:1080, height:1920})}</div>`)
  + (config.reel.transcript ? `<details><summary>वीडियो का लिखित पाठ</summary><p>${escape(config.reel.transcript)}</p></details>` : '');
const bio = grid([
  `<div>${bioPhoto}</div>`,
  `<div class="panel"><p>${escape(config.bio || 'उम्मीदवार का संक्षिप्त परिचय जोड़ा जाना बाकी है।')}</p><div class="actions">${button('पूरा परिचय पढ़ें', 'about.html', 'light')}</div></div>`
]);
const icons = [
  'M12 21V11m0 4C5 15 3 10 3 5c5 0 9 2 9 7m0 4c0-5 4-8 9-8 0 5-3 8-9 8',
  'M12 6c-3-3-7-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2zm0 0v15',
  'M12 2c-4 6-7 9-7 13a7 7 0 0 0 14 0c0-4-3-7-7-13z',
  'M12 21l-8-8c-5-6 3-12 8-6 5-6 13 0 8 6z',
  'M3 21h18M5 21V10l7-6 7 6v11m-10 0v-7h6v7'
];
const pledges = grid(config.pledges.map((item, index) =>
  `<article class="panel pledge"><div class="pledge-icon" aria-hidden="true"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="${icons[index % icons.length]}"/></svg></div><h3>${escape(item)}</h3></article>`), 'sm:grid-cols-2 lg:grid-cols-3');
const timeline = `<ol class="timeline">${config.timeline.map(item =>
  `<li class="panel"><h3>${escape(item.label)}</h3><p class="muted">${escape(item.detail || 'मसौदा · इस चरण की योजना जोड़ी जानी बाकी है।')}</p></li>`).join('')}</ol>`;
const issues = config.issues.length
  ? `<ul>${config.issues.map(issue => `<li>${escape(issue)}</li>`).join('')}</ul>`
  : '<div class="panel">गाँव की प्राथमिक ज़रूरतों पर उम्मीदवार की बात यहाँ जोड़ी जानी बाकी है।</div>';
const facts = grid(config.facts.map(item => `<article class="panel"><h3>${escape(item.label)}</h3>
<strong class="fact-value">${item.value && webUrl(item.source) ? escape(item.value) : '—'}</strong>
${item.value && webUrl(item.source) ? `<a href="${escape(item.source)}">सत्यापन स्रोत</a>` : '<p class="hint">सत्यापित आँकड़ा बाकी है</p>'}</article>`));
const carousel = (label, slides, variant) => `<div class="carousel ${variant}" role="region" aria-label="${label}" data-carousel>
<div class="carousel-track" tabindex="0" aria-label="${label} की स्लाइड">${slides}</div>
<div class="carousel-controls" hidden>
<button type="button" data-step="-1" aria-label="पिछली स्लाइड">‹</button>
<button type="button" data-pause>रोकें</button>
<button type="button" data-step="1" aria-label="अगली स्लाइड">›</button>
</div></div>`;
const gallery = (items, slider = false) => {
  const slides = items.map(item => `<div class="gallery-item">
${photo(item.file, item.alt, item.caption + ' का चित्र जोड़ा जाना बाकी है।',
    {width:960, height:960, sizes:slider ? gallerySliderSizes : gallerySizes, caption:item.caption})}</div>`).join('');
  return slider ? carousel('फोटो गैलरी', slides, 'gallery-carousel') : `<div class="gallery-grid">${slides}</div>`;
};
const posts = limit => {
  const entries = [...config.updates].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const placeholders = Array.from({length: limit || 1}, () =>
    '<article class="panel"><p class="hint">तारीख जोड़ी जानी बाकी है</p><h3>अपडेट जोड़ा जाना बाकी है</h3></article>');
  const cards = (limit ? entries.slice(0, limit) : entries).map(item =>
    `<article class="panel"><time class="hint" datetime="${escape(item.date)}">${escape(item.dateLabel || 'तारीख जोड़ी जानी बाकी है')}</time><h3>${escape(item.title)}</h3><p>${escape(item.detail)}</p></article>`);
  return grid(cards.concat(limit ? placeholders.slice(cards.length) : cards.length ? [] : placeholders), 'sm:grid-cols-2 lg:grid-cols-3');
};

const form = (kind, wardHint = false) => {
  const active = waUrl || email;
  return `<form class="form" data-topic="${escape(kind)}" data-whatsapp="${escape(waUrl)}" data-email="${escape(email)}" aria-describedby="privacy">
<label>नाम <input name="name" autocomplete="name" required maxlength="80"></label>
<label>फ़ोन <span class="hint">(वैकल्पिक)</span><input name="phone" type="tel" autocomplete="tel" maxlength="20"></label>
<label>संदेश <textarea name="message" required maxlength="1000"${wardHint ? ' aria-describedby="ward-hint"' : ''}></textarea></label>
${wardHint ? '<p id="ward-hint" class="hint">अगर चाहें, संदेश में अपने वार्ड या मोहल्ले का नाम लिखें।</p>' : ''}
<label class="check"><input type="checkbox" name="consent"> मैं इस संदेश के बारे में संपर्क की अनुमति देता/देती हूँ।</label>
<p class="hint" id="privacy">इस वेबसाइट पर आपका संदेश सहेजा नहीं जाता। भेजने पर यह आपके व्हाट्सऐप या ईमेल ऐप में खुलेगा। संपर्क की अनुमति देने पर ही आपका दिया हुआ फ़ोन संदेश में शामिल होगा।</p>
${active ? '' : '<p class="hint">संदेश भेजने का संपर्क जोड़ा जाना बाकी है।</p>'}
<button class="button" type="submit" disabled>संदेश तैयार करें</button><p role="status"></p></form>`;
};
const hero = `<section class="hero wrap"><div class="hero-grid">
<div class="hero-copy"><p class="eyebrow">${escape(config.place)}</p><h1>${escape(config.name)}</h1><p class="role">${escape(config.office)}</p>
<p class="tagline">${escape(config.tagline)}</p><p class="hero-subtitle">${escape(config.subtitle)}</p></div>
<div class="portrait">${carousel('प्रचार के चित्र',
  photo(config.portrait, config.portraitAlt, 'नमस्ते करते हुए उम्मीदवार की तस्वीर यहाँ जोड़ी जाएगी।',
    {width:1200, height:1500, sizes:heroSizes, eager:true}) +
  photo(config.heroBanner, config.heroBannerAlt, 'अभियान पोस्टर जोड़ा जाना बाकी है।',
    {width:800, height:1000}), 'hero-carousel')}</div>
<div class="actions hero-actions">${button('मेरा संकल्प देखें', 'vision.html', 'gold')}${button('व्हाट्सऐप पर जुड़ें', waUrl)}</div>
</div></section>`;
const home = hero
  + '<div class="intro-pair">' + section('परिचय वीडियो', video)
  + section('संक्षिप्त परिचय', bio) + '</div>'
  + divider + section('मेरा संकल्प', pledges)
  + section('विकास की रूपरेखा', timeline)
  + section('अमरगढ़ की ज़रूरतें', issues)
  + section('आँकड़े', facts, 'facts')
  + section('गैलरी', gallery(config.gallery, true) + '<div class="actions">' + button('सभी फोटो देखें', 'gallery.html', 'light') + '</div>')
  + section('ताज़ा अपडेट', posts(3))
  + section('आपकी राय', '<h3>आपके गाँव की सबसे बड़ी समस्या क्या है?</h3>' + form('गाँव के लिए सुझाव', true))
  + appeal;

const bodies = {
  index: home,
  about: section('उम्मीदवार के बारे में', grid([
    bioPhoto,
    `<div class="panel"><h2>${escape(config.name)}</h2><p>${escape(config.office)}</p><p>${escape(config.bio || pending)}</p></div>`
  ])),
  vision: section('ग्राम पंचायत के लिए पाँच संकल्प', pledges) + section('विकास का संकल्प', `<p>${escape(config.subtitle)}</p>`),
  plan: section('क्षेत्रवार विकास योजना', grid(config.plan.map(item => panel(item.label, item.detail)))) +
    section('विकास की रूपरेखा', timeline) + section('अमरगढ़ की ज़रूरतें', issues),
  gallery: section('तस्वीरें', gallery(config.gallery)) + section('वीडियो', video),
  updates: section('अभियान और बैठकों की जानकारी', posts()),
  join: section('स्वयंसेवक के रूप में जुड़ें', form('स्वयंसेवा')),
  contact: section('संपर्क विवरण', details + `<div class="actions">${button('व्हाट्सऐप पर जुड़ें', waUrl)}${button('कॉल करें', callUrl, 'light')}</div>`) +
    section('अमरगढ़ का नक्शा', webUrl(config.mapUrl)
      ? button('नक्शा खोलें', config.mapUrl, 'light')
      : '<div class="placeholder">नक्शे का लिंक जोड़ा जाना बाकी है।</div>')
};

mkdirSync('dist', {recursive: true});
cpSync('assets', 'dist/assets', {recursive: true});
cpSync('src/site.js', 'dist/site.js');

for (const [slug, label] of pages) {
  const title = slug === 'index' ? config.name + ' | सरपंच पद हेतु, अमरगढ़' : label + ' | ' + config.name;
  const description = config.metaDescriptions[slug];
  const url = base && base + '/' + (slug === 'index' ? '' : slug + '.html');
  const share = base && asset(config.shareImage) && base + '/' + config.shareImage;
  const heroSrcset = slug === 'index' && asset(config.portrait) && sources(config.portrait);
  writeFileSync('dist/' + slug + '.html', `<!doctype html>
<html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}">
${config.noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="website"><meta property="og:locale" content="hi_IN">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
${url ? `<link rel="canonical" href="${escape(url)}"><meta property="og:url" content="${escape(url)}">` : ''}
${share ? `<meta property="og:image" content="${escape(share)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escape(config.name)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
${heroSrcset ? `<link rel="preload" as="image" href="${escape(config.portrait)}" imagesrcset="${escape(heroSrcset)}" imagesizes="${heroSizes}">` : ''}
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&amp;display=swap">
<script src="site.js" defer></script></head>
<body>${header(slug)}<main id="main">${slug === 'index' ? '' : heading(label)}${bodies[slug]}</main>${footer}</body></html>`);
}

const routes = base ? pages.map(([slug]) => '<url><loc>' + escape(base + '/' + (slug === 'index' ? '' : slug + '.html')) + '</loc></url>').join('\n') : '';
writeFileSync('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + routes + '\n</urlset>\n');
writeFileSync('dist/robots.txt', 'User-agent: *\nAllow: /\n' + (base ? 'Sitemap: ' + base + '/sitemap.xml\n' : ''));

const cli = 'node_modules/tailwindcss/lib/cli.js';
if (existsSync(cli)) {
  const result = spawnSync(process.execPath, [cli, '-i', 'src/site.css', '-o', 'dist/site.css', '--content', 'dist/*.html', '--minify'], {stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
} else {
  // shortcut: offline builds use the committed utilities, install Tailwind before adding utility classes.
  const fallback = readFileSync('src/utilities.css', 'utf8');
  const css = readFileSync('src/site.css', 'utf8').replace('@tailwind utilities;', fallback);
  writeFileSync('dist/site.css', css);
}
