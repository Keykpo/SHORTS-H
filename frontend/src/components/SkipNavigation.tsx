/**
 * Skip Navigation Component
 * Allows keyboard users to skip directly to main content
 */
export default function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:font-semibold"
    >
      Saltar al contenido principal
    </a>
  );
}

/**
 * Main Content Wrapper
 * Use this to wrap your main content area
 */
export function MainContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="main-content" className={className} tabIndex={-1}>
      {children}
    </main>
  );
}
