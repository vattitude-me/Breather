import type { ReactNode, SVGProps } from 'react';

function Icon({ size = 24, strokeWidth = 2, children, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

type P = { size?: number; strokeWidth?: number };

export const ArrowRight = (p: P) => <Icon size={20} {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
export const ChevronRight = (p: P) => <Icon size={18} {...p}><path d="m9 18 6-6-6-6" /></Icon>;
export const ChevronLeft = (p: P) => <Icon size={22} {...p}><path d="m15 18-6-6 6-6" /></Icon>;
export const Close = (p: P) => <Icon size={22} {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
export const Check = (p: P) => <Icon size={12} strokeWidth={3} {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
export const Flame = (p: P) => (
  <Icon size={14} strokeWidth={2.2} {...p}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </Icon>
);
export const Pause = (p: P) => <Icon size={22} {...p}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></Icon>;
export const Play = (p: P) => <Icon size={24} {...p}><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></Icon>;
export const Wind = (p: P) => (
  <Icon size={22} {...p}>
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2" /><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" /><path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
  </Icon>
);
export const Leaf = (p: P) => (
  <Icon size={22} {...p}>
    <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </Icon>
);
export const Volume = (p: P) => <Icon size={22} {...p}><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></Icon>;
export const VolumeOff = (p: P) => <Icon size={22} {...p}><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6" /><path d="m16 9 6 6" /></Icon>;
export const Home = (p: P) => <Icon strokeWidth={1.8} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Icon>;
export const Chart = (p: P) => <Icon strokeWidth={1.8} {...p}><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></Icon>;
export const Gear = (p: P) => (
  <Icon strokeWidth={1.8} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </Icon>
);
