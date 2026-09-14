/**
 * The three button roles in the app. Every button is at least 44px tall.
 * primary: the one action on the screen. secondary: everything else. danger: destructive.
 * ghost: text-only, for inline actions.
 */
const STYLES = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 disabled:bg-surface-2 disabled:text-ink-3',
  secondary: 'bg-surface-2 text-ink hover:bg-line-strong disabled:text-ink-3',
  danger: 'bg-danger-soft text-danger hover:brightness-110 disabled:text-ink-3',
  ghost: 'bg-transparent text-ink-2 hover:text-ink hover:bg-surface-2 disabled:text-ink-3',
};

const SIZES = {
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-5 text-base',
};

const Button = ({ variant = 'secondary', size = 'md', className = '', type = 'button', children, ...props }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${STYLES[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
