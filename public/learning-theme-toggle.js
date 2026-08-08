(function () {
  const root = document.documentElement;
  const button = document.getElementById('learningThemeToggle');
  if (!button) return;

  const stored = localStorage.getItem('VieGeo_theme') || localStorage.getItem('viegeo-theme');
  const initial = stored === 'dark' ? 'dark' : 'light';

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    localStorage.setItem('VieGeo_theme', theme);
    localStorage.setItem('viegeo-theme', theme);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('title', theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
  }

  apply(initial);
  button.addEventListener('click', function () {
    apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
})();
