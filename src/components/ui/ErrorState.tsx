import type { ReactNode } from "react";

export function ErrorState({
  title = "Something didn’t load",
  description,
  children,
}: {
  title?: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">!</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children && <div className="error-state__action">{children}</div>}
    </div>
  );
}
