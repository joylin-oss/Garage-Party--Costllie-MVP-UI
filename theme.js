// Apply early to prevent flash of wrong theme
(function() {
    const savedTheme = localStorage.getItem('costllie-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
