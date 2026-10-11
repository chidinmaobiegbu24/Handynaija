import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page-section"><div className="container narrow-container">
      <p className="eyebrow">A little more help is on the way</p><h1 className="page-title">{title}</h1>
      <EmptyState title="This screen is ready for its next step" description="The route and role-aware layout are in place. Its full workflow will be built in a later feature step." />
      <Link className="text-link" to="/dashboard">Back to your dashboard →</Link>
    </div></section>
  );
}
