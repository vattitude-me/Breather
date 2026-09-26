import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowRight, ChevronRight } from './icons';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  /** Right-hand content; defaults to an arrow. */
  meta?: ReactNode;
}

export function PrimaryButton({ label, meta, className = '', ...rest }: PrimaryButtonProps) {
  return (
    <button className={`btn-primary ${className}`} {...rest}>
      <span>{label}</span>
      {meta === undefined ? <ArrowRight /> : <span className="btn-meta">{meta}</span>}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  );
}

interface RowProps {
  label: string;
  sub?: string;
  value?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
}

export function Row({ label, sub, value, chevron, onClick }: RowProps) {
  const content = (
    <>
      <span className="row-label">
        <span>{label}</span>
        {sub && <span className="row-sub">{sub}</span>}
      </span>
      <span className="row-value">
        {value}
        {chevron && <ChevronRight />}
      </span>
    </>
  );
  return onClick ? (
    <button className="row" onClick={onClick}>{content}</button>
  ) : (
    <div className="row">{content}</div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3 className="section-title">{title}</h3>
      <div className="card list">{children}</div>
    </section>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <h3 className="sheet-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="dots" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i === step ? 'active' : ''} />
      ))}
    </div>
  );
}
