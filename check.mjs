import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const pages = readdirSync('dist').filter(file => file.endsWith('.html'));
assert.equal(pages.length, 8);
for (const file of pages) {
  const html = readFileSync(join('dist', file), 'utf8');
  assert.match(html, /<html lang="hi">/);
  assert.match(html, /<meta property="og:title"/);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 2);
  assert.match(html, /कुछ चित्र\/वीडियो AI की सहायता से बनाए गए हैं/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (link.startsWith('#')) assert.ok(html.includes('id="' + link.slice(1) + '"'), file + ': ' + link);
    else if (!/^(https?:|tel:|mailto:)/.test(link)) assert.ok(existsSync(join('dist', link)), file + ': ' + link);
  }
}

const home = readFileSync('dist/index.html', 'utf8');
const sections = ['परिचय वीडियो','संक्षिप्त परिचय','मेरा संकल्प','विकास की रूपरेखा','अमरगढ़ की ज़रूरतें','आँकड़े','गैलरी','ताज़ा अपडेट','आपकी राय'];
let last = home.indexOf('<section class="hero wrap"');
assert.ok(last >= 0);
for (const title of sections) {
  const next = home.indexOf('<h2>' + title + '</h2>');
  assert.ok(next > last, title);
  last = next;
}
assert.ok(home.indexOf('<section class="appeal"') > last);
assert.equal((home.match(/<section\b/g) || []).length, 11);
for (const file of ['index.html', 'join.html']) {
  const html = readFileSync(join('dist', file), 'utf8');
  assert.deepEqual([...html.matchAll(/<(?:input|textarea) name="([^"]+)"|<input type="checkbox" name="([^"]+)"/g)].map(match => match[1] || match[2]), ['name','phone','message','consent']);
}
assert.ok(existsSync('dist/sitemap.xml'));
console.log('Verified eight pages, navigation, local links, home section order and form fields.');
