export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="loading-spinner" role="status">
      <span className="sr-only">{label}</span>
    </span>
  );
}
