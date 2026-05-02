import { COLORS } from '../constants';

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="64" height="64" rx="14" fill="white"/>
      <defs>
        <clipPath id="logo-top"><polygon points="0,0 64,0 64,24 0,42"/></clipPath>
        <clipPath id="logo-bottom"><polygon points="0,44 64,26 64,64 0,64"/></clipPath>
      </defs>
      <g clipPath="url(#logo-top)" transform="translate(-1.5, -1.5)">
        <path d="M18,8 L18,56 L34,56 C44,56 50,50 50,43 C50,37 46,33 40,32 C45,31 48,27 48,22 C48,15 43,8 33,8 Z M25,15 L33,15 C38,15 41,18 41,22 C41,26 38,29 33,29 L25,29 Z M25,35 L34,35 C40,35 43,38 43,43 C43,48 40,49 34,49 L25,49 Z" fill={COLORS.primary}/>
      </g>
      <g clipPath="url(#logo-bottom)" transform="translate(1.5, 1.5)">
        <path d="M18,8 L18,56 L34,56 C44,56 50,50 50,43 C50,37 46,33 40,32 C45,31 48,27 48,22 C48,15 43,8 33,8 Z M25,15 L33,15 C38,15 41,18 41,22 C41,26 38,29 33,29 L25,29 Z M25,35 L34,35 C40,35 43,38 43,43 C43,48 40,49 34,49 L25,49 Z" fill={COLORS.primary}/>
      </g>
    </svg>
  );
}
