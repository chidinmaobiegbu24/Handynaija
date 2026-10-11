import { Link } from "react-router-dom";
import { routePaths } from "../../constants/routes";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" id="footer-support">
      <div className="container">
        <div className="site-footer__main">
          <div className="site-footer__brand-column">
            <Link className="brand brand--footer" to={routePaths.home} aria-label="HandyNaija home">
              <span className="brand__mark" aria-hidden="true">h</span>
              <span>Handy<span className="brand__accent">Naija</span></span>
            </Link>
            <p>Skilled hands. Local solutions.</p>
            <span className="site-footer__tagline">Good hands, close by.</span>
          </div>
          <nav className="site-footer__group" aria-label="Explore HandyNaija">
            <h2>Explore</h2>
            <Link to={routePaths.services}>Services</Link>
            <Link to={routePaths.providers}>Find Providers</Link>
            <Link to={`${routePaths.home}#how-it-works`}>How It Works</Link>
            <Link to={`${routePaths.home}#why-handynaija`}>Why HandyNaija</Link>
          </nav>
          <nav className="site-footer__group" aria-label="For customers">
            <h2>For Customers</h2>
            <Link to={routePaths.customerDashboard}>Dashboard</Link>
            <Link to={routePaths.requests}>Requests</Link>
            <Link to={routePaths.messages}>Messages</Link>
          </nav>
          <nav className="site-footer__group" aria-label="For providers">
            <h2>For Providers</h2>
            <Link to={routePaths.providerDashboard}>Provider Dashboard</Link>
            <Link to="/provider/services">Manage Services</Link>
            <Link to="/provider/availability">Availability</Link>
          </nav>
          <nav className="site-footer__group" aria-label="Policies">
            <h2>Policies</h2>
            <Link to={routePaths.privacy}>Privacy Policy</Link>
            <Link to={routePaths.terms}>Terms of Service</Link>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <span className="site-footer__copyright">© {year} HandyNaija · Good hands, close by.</span>
          <span>Built for local service discovery across Nigeria.</span>
        </div>
      </div>
    </footer>
  );
}