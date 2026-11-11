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
