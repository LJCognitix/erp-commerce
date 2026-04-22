import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
      icon: 'h-9 w-9',
    };
    const variants: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
    };
    return <button ref={ref} className={cn('btn', variants[variant], variant === 'primary' ? '' : sizes[size], className)} {...props} />;
  }
);
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('input', className)} {...props} />
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn('input min-h-[80px]', className)} {...props} />
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn('input cursor-pointer', className)} {...props} />
);
Select.displayName = 'Select';

interface CardProps extends HTMLAttributes<HTMLDivElement> { interactive?: boolean; }

export function Card({ className, interactive, ...props }: CardProps) {
  return <div className={cn('card p-5 shadow-card', interactive && 'transition-all hover:border-brand-500/40 hover:shadow-glow', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-base font-semibold text-[var(--text-primary)]', className)} {...props} />;
}

type BadgeColor = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export function Badge({ color = 'muted', children, className }: { color?: BadgeColor; children: ReactNode; className?: string }) {
  const map: Record<BadgeColor, string> = {
    brand: 'bg-brand-500/15 text-brand-200 border-brand-500/30',
    accent: 'bg-accent/15 text-accent-500 border-accent/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    muted: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
  };
  return <span className={cn('pill', map[color], className)}>{children}</span>;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full card shadow-2xl max-h-[90vh] overflow-auto', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="btn-ghost rounded p-1" aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function SlidePanel({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-auto animate-fade-in">
        <div className="sticky top-0 z-10 glass flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost rounded p-1" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
