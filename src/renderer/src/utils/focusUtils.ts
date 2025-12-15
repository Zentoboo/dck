/**
 * Focus utilities for Electron apps
 * 
 * Electron has issues with focus restoration after native dialogs (confirm, alert).
 * These utilities help restore focus properly.
 */

/**
 * Restore focus to a specific element after a delay
 * Use after confirm/alert dialogs to fix focus loss
 * 
 * Uses blur → focus trick to force Electron to properly restore focus
 */
export function restoreFocus(selector: string, delay: number = 150): void {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && typeof element.focus === 'function') {
      // Critical: blur first to detach old focus state
      element.blur();
      // Then focus after microtask
      setTimeout(() => element.focus(), 10);
    }
  }, delay);
}

/**
 * Show confirm dialog and restore focus afterward
 * Returns the user's choice (true/false)
 * 
 * Note: This is a workaround. For best results, use Electron's native dialog API.
 */
export function confirmWithFocusRestore(
  message: string,
  focusSelector: string = '.text-editor',
  delay: number = 150
): boolean {
  const result = window.confirm(message);
  restoreFocus(focusSelector, delay);
  return result;
}

/**
 * Show alert dialog and restore focus afterward
 * 
 * Note: This is a workaround. For best results, use Electron's native dialog API.
 */
export function alertWithFocusRestore(
  message: string,
  focusSelector: string = '.text-editor',
  delay: number = 150
): void {
  window.alert(message);
  restoreFocus(focusSelector, delay);
}