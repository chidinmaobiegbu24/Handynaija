import { Badge } from "./Badge";

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "Accepted" || status === "Completed"
    ? "success"
    : status === "Pending" || status === "Scheduled"
      ? "warning"
      : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
