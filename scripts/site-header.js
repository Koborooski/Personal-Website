// Sliding underline for the site header nav.
// One green bar sits under the current page's link and glides to whichever link
// you hover or focus, then glides back when you move away.
// Without this script, site-header.css falls back to a plain underline per link.
document.querySelectorAll('.site-nav').forEach(nav => {
  const links = [...nav.querySelectorAll('a')];
  const active = nav.querySelector('a.nav-active');

  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.appendChild(indicator);
  nav.classList.add('has-indicator');

  function moveTo(link) {
    if (!link) {
      indicator.style.opacity = '0';
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = `translate(${rect.left - navRect.left}px, ${rect.bottom - navRect.bottom}px)`;
    indicator.style.opacity = '1';
  }

  // Place it under the current page right away, without animating in from the left
  indicator.style.transition = 'none';
  moveTo(active);
  indicator.getBoundingClientRect();   // apply that position before turning transitions back on
  indicator.style.transition = '';

  links.forEach(link => {
    link.addEventListener('mouseenter', () => moveTo(link));
    link.addEventListener('focus', () => moveTo(link));
  });
  nav.addEventListener('mouseleave', () => moveTo(active));
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget)) moveTo(active);
  });

  // Links can wrap or shift when the window resizes, or when the web font finishes loading
  window.addEventListener('resize', () => moveTo(active));
  document.fonts?.ready.then(() => moveTo(active));
});
