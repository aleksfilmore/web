document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
  };
  const onToggle = (e) => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    if (isOpen) close(); else open();
  };

  // Click-only to avoid iOS double-trigger; no preventDefault
  toggle.addEventListener('click', onToggle);

  // Close when clicking any link inside (handles nested elements)
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) close();
  });

  // Close when clicking outside while open
  document.addEventListener('click', (e) => {
    const isOpen = !menu.classList.contains('hidden');
    if (!isOpen) return;
    if (!toggle.contains(e.target) && !menu.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
});
