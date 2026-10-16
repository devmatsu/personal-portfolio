// Runs right after the header Search button so its shortcut hint is right before first paint: ⌘K on Apple devices,
// Ctrl K elsewhere.
(function () {
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const mac = /mac|iphone|ipad|ipod/i.test(platform);
  const button = document.currentScript.previousElementSibling;
  button.querySelector('[data-shortcut]').textContent = mac ? '⌘K' : 'Ctrl K';
  button.setAttribute('aria-keyshortcuts', mac ? 'Meta+K' : 'Control+K');
})();
