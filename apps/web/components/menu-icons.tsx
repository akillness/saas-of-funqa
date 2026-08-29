import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    />
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </BaseIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 10.5 12 4l7.5 6.5" />
      <path d="M6.5 9.8V20h11V9.8" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m15.5 15.5 4 4" />
    </BaseIcon>
  );
}

export function FilmIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="14" rx="2" width="17" x="3.5" y="5" />
      <path d="M7.5 5v14" />
      <path d="M16.5 5v14" />
      <path d="M3.5 9.5h4" />
      <path d="M3.5 14.5h4" />
      <path d="M16.5 9.5h4" />
      <path d="M16.5 14.5h4" />
    </BaseIcon>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 4v4.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V4" />
      <path d="M9 4h6" />
      <path d="M8.4 14h7.2" />
    </BaseIcon>
  );
}

export function RalphIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7.2 7.5a6.8 6.8 0 0 1 10.4.8" />
      <path d="M17.8 4.8v3.8h-3.8" />
      <path d="M16.8 16.5a6.8 6.8 0 0 1-10.4-.8" />
      <path d="M6.2 19.2v-3.8h3.8" />
      <path d="M9.5 12h5" />
      <path d="M12 9.5v5" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5 5.5 6v5.4c0 4 2.5 6.9 6.5 9.1 4-2.2 6.5-5.1 6.5-9.1V6L12 3.5Z" />
      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
    </BaseIcon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.5 5.5h9.2a2 2 0 0 1 2 2v11a1 1 0 0 1-1.4.9A7 7 0 0 0 13 18.5H7.5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <path d="M8.5 8.5h7" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 14.5h4.5" />
    </BaseIcon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.5 2.4 4 5.3 4 8.5s-1.5 6.1-4 8.5c-2.5-2.4-4-5.3-4-8.5s1.5-6.1 4-8.5Z" />
    </BaseIcon>
  );
}

export function EnglishIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="9" fill="currentColor" opacity="0.12" />
      <path d="M8 17V7h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8 12h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8 17h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function KoreanIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="9" fill="currentColor" opacity="0.12" />
      <path d="M8 8.5v7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8 12h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M15 8.5v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M15 12h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

/** Stacked layers: the scene vector store, one layer per indexed frame. */
export function LayersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3.5 8 4.2-8 4.2-8-4.2 8-4.2Z" />
      <path d="m4 12 8 4.2 8-4.2" />
      <path d="m4 16.2 8 4.2 8-4.2" />
    </BaseIcon>
  );
}

export function LoginIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 6.5H18a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 17.5h-3.5" />
      <path d="M10.5 8.5 14 12l-3.5 3.5" />
      <path d="M4.5 12H14" />
    </BaseIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9.5 6.5H6A1.5 1.5 0 0 0 4.5 8v8A1.5 1.5 0 0 0 6 17.5h3.5" />
      <path d="M13.5 8.5 10 12l3.5 3.5" />
      <path d="M20 12H10" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8.2" r="3.2" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
    </BaseIcon>
  );
}
