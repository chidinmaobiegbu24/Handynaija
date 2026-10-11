import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="not-found"><div className="container"><p className="eyebrow">Wrong turn?</p><h1>We can’t find that page.</h1><p>Let’s get you back to the help you need.</p><Link className="button button--primary" to="/">Back to HandyNaija</Link></div></section>
  );
}
