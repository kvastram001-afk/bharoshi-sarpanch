const menu = document.querySelector('.menu');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
document.addEventListener('click', event => {
  if (menu?.open && !menu.contains(event.target)) menu.open = false;
});

for (const carousel of document.querySelectorAll('[data-carousel]')) {
  const track = carousel.querySelector('.carousel-track');
  const controls = carousel.querySelector('.carousel-controls');
  const pause = carousel.querySelector('[data-pause]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let inView = false;
  let lastAction = 0;

  const move = direction => {
    const maximum = track.scrollWidth - track.clientWidth;
    const step = (track.children[1]?.offsetLeft ?? 0) - track.children[0].offsetLeft;
    if (maximum <= 1 || step <= 0) return;
    const position = track.scrollLeft;
    const next = direction > 0 && position >= maximum - 2 ? 0
      : direction < 0 && position <= 2 ? maximum
      : Math.max(0, Math.min(maximum, (Math.round(position / step) + direction) * step));
    track.scrollTo({left: next, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  };
  const syncPause = () => { pause.textContent = paused ? 'चलाएँ' : 'रोकें'; };
  syncPause();
  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    lastAction = Date.now();
    if (button === pause) {
      paused = !paused;
      syncPause();
    } else {
      move(Number(button.dataset.step));
    }
  });
  track.addEventListener('pointerdown', () => { lastAction = Date.now(); });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) paused = true;
    syncPause();
  });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; })
    .observe(track);
  setInterval(() => {
    if (!paused && inView && !document.hidden && Date.now() - lastAction >= 5000 &&
        !carousel.matches(':focus-within') && !carousel.matches(':hover')) move(1);
  }, 5000);
}

for (const form of document.querySelectorAll('.form')) {
  const {topic, whatsapp, email} = form.dataset;
  if (!whatsapp && !email) continue;
  const {name, phone, message, consent} = form.elements;
  const status = form.querySelector('[role=status]');
  const validate = () => {
    name.setCustomValidity(name.value.trim() ? '' : 'अपना नाम लिखें।');
    message.setCustomValidity(message.value.trim() ? '' : 'अपना संदेश लिखें।');
    const number = phone.value.trim().replace(/[ ()-]/g, '');
    phone.setCustomValidity(!number || /^\+?\d{7,15}$/.test(number) ? '' : 'सही फ़ोन नंबर लिखें।');
  };

  form.addEventListener('input', validate);
  form.addEventListener('submit', event => {
    event.preventDefault();
    validate();
    if (!form.reportValidity()) return;

    const lines = [topic, 'नाम: ' + name.value.trim(), 'संदेश: ' + message.value.trim()];
    if (consent.checked) {
      lines.push('इस संदेश के बारे में संपर्क की अनुमति है।');
      if (phone.value.trim()) lines.push('फ़ोन: ' + phone.value.trim());
    }
    const body = encodeURIComponent(lines.join('\n'));
    const target = whatsapp
      ? whatsapp + '?text=' + body
      : email ? 'mailto:' + email + '?subject=' + encodeURIComponent(topic) + '&body=' + body : '';
    if (target) {
      status.textContent = 'अपने ऐप में संदेश देखकर भेजें।';
      window.location.href = target;
    }
  });
  form.querySelector('button[type=submit]').disabled = false;
}
