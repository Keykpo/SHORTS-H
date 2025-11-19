/**
 * Accessibility Utilities
 * Helper functions for improved accessibility
 */

/**
 * Formats a number with appropriate suffix for screen readers
 * Example: 1500 -> "1.5 mil" or "mil quinientos"
 */
export function formatNumberForScreenReader(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} millones`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} mil`;
  }
  return num.toString();
}

/**
 * Formats duration for screen readers
 * Example: 125 -> "2 minutos y 5 segundos"
 */
export function formatDurationForScreenReader(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  if (secs > 0) parts.push(`${secs} ${secs === 1 ? 'segundo' : 'segundos'}`);

  return parts.join(' y ');
}

/**
 * Formats relative time for screen readers
 * Example: "hace 2 horas" -> "publicado hace 2 horas"
 */
export function formatRelativeTimeForScreenReader(timeAgo: string): string {
  return `publicado ${timeAgo}`;
}

/**
 * Creates an ARIA label for video cards
 */
export function createVideoAriaLabel({
  title,
  author,
  views,
  timeAgo,
  duration,
}: {
  title: string;
  author: string;
  views?: number;
  timeAgo?: string;
  duration?: number;
}): string {
  const parts = [title, `por ${author}`];

  if (views !== undefined) {
    parts.push(`${formatNumberForScreenReader(views)} vistas`);
  }

  if (timeAgo) {
    parts.push(formatRelativeTimeForScreenReader(timeAgo));
  }

  if (duration) {
    parts.push(`duración ${formatDurationForScreenReader(duration)}`);
  }

  return parts.join(', ');
}

/**
 * Creates an ARIA label for like buttons
 */
export function createLikeButtonAriaLabel(isLiked: boolean, count?: number): string {
  const action = isLiked ? 'Quitar me gusta' : 'Dar me gusta';
  if (count !== undefined && count > 0) {
    return `${action}, ${formatNumberForScreenReader(count)} me gusta`;
  }
  return action;
}

/**
 * Creates an ARIA label for share buttons
 */
export function createShareButtonAriaLabel(videoTitle: string): string {
  return `Compartir video: ${videoTitle}`;
}

/**
 * Creates an ARIA label for playlist add buttons
 */
export function createPlaylistButtonAriaLabel(videoTitle: string): string {
  return `Agregar ${videoTitle} a lista de reproducción`;
}

/**
 * Trap focus within a modal
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Handle keyboard shortcuts
 */
export function createKeyboardShortcutHandler(shortcuts: {
  [key: string]: (e: KeyboardEvent) => void;
}) {
  return (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    const handler = shortcuts[key];

    if (handler) {
      e.preventDefault();
      handler(e);
    }
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
