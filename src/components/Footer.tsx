export function Footer() {
  return (
    <footer className="ieee-footer">
      <nav className="footer-links" aria-label="IEEE policies">
        <a href="http://www.ieee.org/index.html">Home</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://www.ieee.org/sitemap.html">Sitemap</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://www.ieee.org/about/contact_center/index.html">Contact &amp; Support</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://www.ieee.org/accessibility_statement.html">Accessibility</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://www.ieee.org/p9-26.html">Nondiscrimination Policy</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://ieee-ethics-reporting.org/">IEEE Ethics Reporting</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="http://www.ieee.org/security_privacy.html">IEEE Privacy Policy</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="https://www.ieee.org/about/help/site-terms-conditions.html">Terms &amp; Disclosures</a>
        <span className="divider" aria-hidden="true">
          |
        </span>
        <a href="https://www.ieee.org/about/feedback-ieee-site.html">Feedback</a>
      </nav>
      <p className="copyright">
        &copy; Copyright {new Date().getFullYear()} IEEE - All rights reserved. A public charity, IEEE is the
        world&apos;s largest technical professional organization dedicated to advancing technology for the benefit
        of humanity.
      </p>
    </footer>
  );
}
