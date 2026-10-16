// Page-wide widget shortcuts must never steal keys meant for something the visitor is using:
// text fields keep typing, and focused controls (links, buttons, the header Search) keep their
// native Space/Enter activation. Other keys, like a letter shortcut, still reach the page after a
// button was clicked. Elements marked [data-shortcut-surface] opt back in, e.g. the Rubik clock,
// which is a button whose whole purpose is the Space shortcut.
const TEXT_ENTRY = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';
const CONTROL = 'a[href], button, summary, [role="button"], [role="link"], [role="option"], [tabindex]:not([tabindex="-1"])';

export function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

export function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TEXT_ENTRY) !== null;
}

/** True when a page-wide shortcut may handle this key press. */
export function isShortcutTarget(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || hasModifier(event) || isTextEntry(event.target)) return false;
  if (document.querySelector('dialog[open]')) return false;
  const target = event.target;
  if (!(target instanceof Element) || target.closest('[data-shortcut-surface]')) return true;
  const activates = event.code === 'Space' || event.key === ' ' || event.key === 'Enter';
  return !activates || target.closest(CONTROL) === null;
}
