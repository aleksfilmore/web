
document.addEventListener('scroll', () => {
  document.querySelectorAll('.fade-on-scroll').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add('visible');
    }
  });
});
