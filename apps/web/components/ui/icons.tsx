import type { SVGProps } from "react";

/**
 * Sem biblioteca de ícones (design/SYNTEX-UI.md §10: biblioteca visual nova
 * fora da stack exige permissão prévia). Este é o conjunto mínimo que o
 * shell e o SyntexStatus desta fatia realmente usam — SVG desenhado à mão,
 * 16/18/20px, stroke=currentColor para herdar a cor do token que o chama.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconDot(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="4.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTriangleAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3.5 17.5 16h-15Z" />
      <path d="M10 8.25v3.5" />
      <circle cx="10" cy="13.75" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function IconDispute(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="10" r="4.3" />
      <circle cx="12" cy="10" r="4.3" />
    </svg>
  );
}

export function IconXCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M8 8l4 4M12 8l-4 4" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5.5" y="9" width="9" height="7" rx="1.4" />
      <path d="M7.25 9V6.75a2.75 2.75 0 0 1 5.5 0V9" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 10.5 8 14l7.5-8" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 9.25v4" />
      <circle cx="10" cy="6.75" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m17 17-3.5-3.5" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 8a4 4 0 0 1 8 0c0 3.2 1 4.5 1.5 5H4.5c.5-.5 1.5-1.8 1.5-5Z" />
      <path d="M8.5 15.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="7.5" r="3" />
      <path d="M4.5 16c1-3 3.2-4.5 5.5-4.5S14.5 13 15.5 16" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m8 5.5 4.5 4.5L8 14.5" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
    </svg>
  );
}

export function IconPanelLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4" width="13" height="12" rx="1.5" />
      <path d="M8.5 4v12" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4.5" y="3.5" width="9" height="13" rx="1" />
      <path d="M8 7h2M8 10h2M8 13h2" />
      <path d="M13.5 8.5H16v8h-2.5" />
    </svg>
  );
}
