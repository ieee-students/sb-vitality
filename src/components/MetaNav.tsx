export function MetaNav() {
  return (
    <nav className="ieee-meta-nav" aria-label="IEEE global">
      <div className="meta-nav-left">
        <a href="https://www.ieee.org/index.html">IEEE.org</a>
        <span className="divider mobile-hidden" aria-hidden="true">
          |
        </span>
        <a href="https://www.ieeexplore.ieee.org/Xplore/guesthome.jsp" className="mobile-hidden">
          IEEE <em>Xplore</em>
          <sup>®</sup>
        </a>
        <span className="divider mobile-hidden" aria-hidden="true">
          |
        </span>
        <a href="https://standards.ieee.org/" className="mobile-hidden">
          IEEE Standards
        </a>
        <span className="divider mobile-hidden" aria-hidden="true">
          |
        </span>
        <a href="https://spectrum.ieee.org/" className="mobile-hidden">
          IEEE Spectrum
        </a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="https://www.ieee.org/sitemap.html">More Sites</a>
      </div>
      <div className="meta-nav-right">
        <a href="https://www.ieee.org/membership/join/index.html?WT.mc_id=hc_join">Join IEEE</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="https://www.ieee.org/give">Donate</a>
      </div>
    </nav>
  );
}

