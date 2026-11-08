export function applyThemeToDOM(themeObj) {
  const root = document.documentElement;
  const setShades = (prefix, shades) => {
    for (let i = 50; i <= 900; i += 50) {
      const key = i.toString();
      root.style.setProperty(`--${prefix}-${key}`, shades[key] || shades[500]);
    }
  };
  setShades('primary', themeObj.primary);
  setShades('accent', themeObj.accent);
  root.style.setProperty('--bg', themeObj.bg);
  root.style.setProperty('--surface', themeObj.surface);
  root.style.setProperty('--text', themeObj.text);
}