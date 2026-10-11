import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { routePaths, getDashboardPath } from "../../constants/routes";
import { useAuth } from "../../state/AuthContext";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    mobileMenuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    navigate(routePaths.home);
    await logout();
    setLoggingOut(false);
  }

  function handleSearchClick() {
    const form = document.getElementById("provider-search");
    if (location.pathname === routePaths.home && form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      form.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
      return;
    }
    navigate(routePaths.providers);
  }

  function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (location.pathname !== routePaths.home) return;
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const dashboardPath = user ? getDashboardPath(user.role) : routePaths.home;

  return (
    <header className="site-header">
      <div className="container navbar">
        <Link className="brand" to={routePaths.home} aria-label="HandyNaija home">
          <span className="brand__mark" aria-hidden="true">h</span>
          <span>Handy<span className="brand__accent">Naija</span></span>
        </Link>
        <nav className="navbar__links" aria-label="Main navigation">
          <NavLink to={routePaths.home}>Home</NavLink>
          <NavLink to={routePaths.services}>Services</NavLink>
          <NavLink to={routePaths.providers}>Providers</NavLink>
          <Link to={`${routePaths.home}#how-it-works`} onClick={(event) => handleSectionClick(event, "how-it-works")}>How It Works</Link>
        </nav>
        <div className="navbar__actions">
          <button className="navbar__search" type="button" aria-label="Search providers" onClick={handleSearchClick}>
            <Icon name="search" size={17} />
          </button>
          {user ? (
            <>
              <Link className="navbar__welcome" to={dashboardPath}>{user.name.split(" ")[0]}</Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Log out"}</Button>
            </>
          ) : (
            <>
              <Link className="navbar__login" to={routePaths.login}>Login</Link>
              <Link className="button button--primary navbar__join" to={routePaths.register}>Get Started</Link>
            </>
          )}
        </div>
        <button
          ref={menuButtonRef}
          className="navbar__menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={22} aria-hidden="true" />
        </button>
      </div>
      <nav
        ref={mobileMenuRef}
        className={`mobile-nav${menuOpen ? " mobile-nav--open" : ""}`}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!menuOpen}
      >
        <NavLink to={routePaths.home}>Home</NavLink>
        <NavLink to={routePaths.services}>Services</NavLink>
        <NavLink to={routePaths.providers}>Providers</NavLink>
        <Link to={`${routePaths.home}#how-it-works`} onClick={(event) => handleSectionClick(event, "how-it-works")}>How It Works</Link>
        {user ? (
          <>
            <Link to={dashboardPath}>My dashboard</Link>
            <button type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Log out"}</button>
          </>
        ) : (
          <>
            <Link to={routePaths.login}>Login</Link>
            <Link to={routePaths.register}>Get Started</Link>
            <Link className="mobile-nav__provider" to={routePaths.providerSignup}>Become a provider →</Link>
          </>
        )}
      </nav>
    </header>
  );
}