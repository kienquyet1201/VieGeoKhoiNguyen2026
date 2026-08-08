(() => {
  const KEY = 'VieGeo_role_theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(KEY) || localStorage.getItem('VieGeo_theme') || 'light';
  const apply = theme => {
    const value = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = value;
    document.body?.setAttribute('data-theme', value);
    document.querySelectorAll('[data-role-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', value === 'dark' ? 'true' : 'false');
      const icon = btn.querySelector('i');
      const text = btn.querySelector('[data-theme-label]');
      if (icon) icon.className = value === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      if (text) text.textContent = value === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';
    });
  };
  root.dataset.theme = saved === 'dark' ? 'dark' : 'light';
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelectorAll('[data-role-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next); localStorage.setItem('VieGeo_theme', next); apply(next);
    }));
  });
})();
