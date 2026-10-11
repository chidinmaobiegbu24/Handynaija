import type { SVGProps } from "react";
import { ICON_PATHS, type IconName } from "./iconData";

export type { IconName } from "./iconData";

export function Icon({
  name,
  size = 24,
  className,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}