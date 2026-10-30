/* Progressive enhancement: all page content remains readable without JavaScript. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const mobile = window.matchMedia('(max-width: 520px)');
  if (header && toggle && nav) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('span').textContent = '+';
      nav.hidden = mobile.matches;
    };
    header.classList.add('nav-ready');
    closeMenu();
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('span').textContent = open ? '−' : '+';
      nav.hidden = !open;
    });
    mobile.addEventListener('change', closeMenu);
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!header.contains(event.target) && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  }
  const copyButton = document.querySelector('[data-copy-email]');
  const status = document.querySelector('.copy-status');
  if (copyButton && status) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyButton.dataset.copyEmail);
        status.textContent = 'Email address copied.';
      } catch {
        status.textContent = 'Please select and copy the email address above.';
      }
    });
  }
})();
