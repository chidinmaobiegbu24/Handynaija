import { Link } from "react-router-dom";
import { routePaths } from "../../constants/routes";

export function AuthBrand() {
  return (
    <Link className="auth-brand" to={routePaths.home} aria-label="HandyNaija home">
      <span className="brand__mark" aria-hidden="true">h</span>
      <span>handy<span className="brand__accent">naija</span></span>
    </Link>
  );
}
