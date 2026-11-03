# IEEE Brand Identity Guidelines

This document outlines the core visual brand identity guidelines for IEEE web applications and materials. For complete details and official assets, refer to the [IEEE Brand Experience Guidelines](https://brand-experience.ieee.org/guidelines/brand-identity/).

---

## 🎨 Color Palette

IEEE's official colors are classified into primary, secondary/accent, and neutral tones. For digital/web applications, utilize the **HEX** or **RGB** values.

### Primary Brand Color
*   **IEEE Blue** (Pantone 3015 C)
    *   **HEX:** `#00629B`
    *   **RGB:** `rgb(0, 98, 155)`
    *   *Usage:* Must be used on all corporate-wide communications. Ideal for backgrounds, brand emphasis, and primary UI elements.

### Secondary & Accent Colors
*   **Cyan:** `#00B5E2` | `rgb(0, 181, 226)`
*   **Teal:** `#009CA6` | `rgb(0, 156, 166)`
*   **Dark Teal:** `#007377` | `rgb(0, 115, 119)`
*   **Dark Green:** `#006341` | `rgb(0, 99, 65)`
*   **Green:** `#00843D` | `rgb(0, 132, 61)`
*   **Olive Green:** `#658D1B` | `rgb(101, 141, 27)`
*   **Bright Green:** `#78BE20` | `rgb(120, 190, 32)`
*   **Yellow:** `#FFD100` | `rgb(255, 209, 0)`
*   **Dark Yellow:** `#FFC72C` | `rgb(255, 199, 44)`
*   **Orange:** `#FFA300` | `rgb(255, 163, 0)`
*   **Dark Orange:** `#E87722` | `rgb(232, 119, 34)`
*   **Red:** `#BA0C2F` | `rgb(186, 12, 47)`
*   **Dark Red:** `#861F41` | `rgb(134, 32, 65)`
*   **Purple:** `#981D97` | `rgb(152, 29, 151)`
*   **Dark Purple:** `#772583` | `rgb(119, 37, 131)`

### Neutrals
*   **Dark Blue:** `#002855` | `rgb(0, 40, 85)`
*   **Black:** `#000000` | `rgb(0, 0, 0)`
*   **Gray:** `#75787B` | `rgb(117, 120, 123)`
*   **White:** `#FFFFFF` | `rgb(255, 255, 255)`

> [!IMPORTANT]
> **Contrast & Accessibility:**
> Always verify that your background/text color combinations satisfy the **WCAG AA contrast ratio standards**. Use WebAIM or other contrast checking tools. Tinted colors are allowed but should not be lower than 10%.

---

## 🔤 Font Family

The IEEE font family is selected for readability, flexibility, and compatibility across both print and digital mediums.

### Primary Fonts (Web & Digital)
*   **Open Sans** (Primary — Body & UI Text)
    *   *Usage:* Permissible and highly recommended for screen-based applications including websites, web ads, emails, and slide presentations. Used for all body copy, labels, navigation, and form elements.
*   **Lora** (Serif — Headings)
    *   *Usage:* Used for / page headings on the web app (imported via Google Fonts). Provides a professional contrast to Open Sans for section titles. Do not use for body copy or UI controls.
*   **Calibri**
    *   *Usage:* Screen-based applications, Microsoft Word documents, and digital layouts. (Open Sans is the primary web alternative).
*   **Formata**
    *   *Usage:* Predominantly used for print applications.

### Secondary Fonts
*   **Adobe Caslon Pro**
    *   *Usage:* Use sparingly, only for headlines or titles.
*   **Cambria**
    *   *Usage:* Use sparingly for formal letters or document bodies.

---

## 🌐 Mandatory Global Page Elements (Master Brand Header & Footer)

Every IEEE web property, organizational unit (OU) portal, and sub-brand web application **must** include IEEE's enterprise-wide master brand elements. For complete corporate rules, refer to the [IEEE Global Page Element and Branding Requirements](https://brand-experience.ieee.org/guidelines/digital/style-guide/global-page-element-and-branding-requirements/).

When replicating or scaffolding a new IEEE web project from this guide, always structure the root layout as a full-height flex column (`min-height: 100vh`) in this exact vertical order:

1. **IEEE Global Meta-Navigation (`MetaNav`)** — Mandatory top black utility bar (scrolls away naturally; not sticky).
2. **Site Navigation Header (`Navigation`)** — Sticky application bar (`position: sticky; top: 0`) featuring the project title paired with the IEEE Master Brand or sponsoring OU sub-brand logo.
3. **Main Content (`<main>`)** — Grows to fill available viewport height (`flex: 1`).
4. **IEEE Global Compliance Footer (`Footer`)** — Mandatory corporate legal links and copyright notice pinned to the bottom (`margin-top: auto`).

---

### 1. IEEE Global Meta-Navigation (`MetaNav`)

The Meta-Navigation bar sits at the very top of every page to signal that the site is part of the official IEEE digital ecosystem.

*   **Visual Rules:** Solid black background (`#000000`), white text (`#FFFFFF`), `min-height: 40px`, horizontal padding `5%`, and system sans-serif typography (`Verdana, Arial, Helvetica, sans-serif` at `0.85em`).
*   **Required Left Links** (separated by `|` dividers):
    *   `IEEE.org` → `https://www.ieee.org/index.html` *(always visible)*
    *   `IEEE Xplore®` (`IEEE <em>Xplore</em><sup>®</sup>`) → `https://www.ieeexplore.ieee.org/Xplore/guesthome.jsp` *(hidden on `<= 800px`)*
    *   `IEEE Standards` → `https://standards.ieee.org/` *(hidden on `<= 800px`)*
    *   `IEEE Spectrum` → `https://spectrum.ieee.org/` *(hidden on `<= 800px`)*
    *   `More Sites` → `https://www.ieee.org/sitemap.html` *(always visible)*
*   **Required Right Links** (separated by `|` dividers, always visible):
    *   `Join IEEE` → `https://www.ieee.org/membership/join/index.html?WT.mc_id=hc_join`
    *   `Donate` → `https://www.ieee.org/give`
*   **Responsive Behavior:** At viewports `<= 800px`, hide secondary links (`IEEE Xplore®`, `IEEE Standards`, `IEEE Spectrum`) and their adjacent dividers so `IEEE.org | More Sites` and `Join IEEE | Donate` remain on a single clean row.

#### Reference Markup (`MetaNav.jsx`)
```jsx
const MetaNav = () => (
  <div className="ieee-meta-nav">
    <div className="meta-nav-left">
      <a href="https://www.ieee.org/index.html">IEEE.org</a>
      <span className="divider mobile-hidden">|</span>
      <a href="https://www.ieeexplore.ieee.org/Xplore/guesthome.jsp" className="mobile-hidden">
        IEEE <em>Xplore</em><sup>®</sup>
      </a>
      <span className="divider mobile-hidden">|</span>
      <a href="https://standards.ieee.org/" className="mobile-hidden">IEEE Standards</a>
      <span className="divider mobile-hidden">|</span>
      <a href="https://spectrum.ieee.org/" className="mobile-hidden">IEEE Spectrum</a>
      <span className="divider">|</span>
      <a href="https://www.ieee.org/sitemap.html">More Sites</a>
    </div>
    <div className="meta-nav-right">
      <a href="https://www.ieee.org/membership/join/index.html?WT.mc_id=hc_join">Join IEEE</a>
      <span className="divider">|</span>
      <a href="https://www.ieee.org/give">Donate</a>
    </div>
  </div>
);
```

#### Reference Styles (`MetaNav.css`)
```css
.ieee-meta-nav {
  min-height: 40px;
  background: #000000;
  color: #ffffff;
  padding: 0 5%;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-size: 0.85em;
  z-index: 1000;
  position: relative;
}

.ieee-meta-nav a {
  color: #ffffff;
  text-decoration: none;
  padding: 11px 0;
  transition: opacity 0.2s;
}

.ieee-meta-nav a:hover {
  text-decoration: underline;
}

.ieee-meta-nav .divider {
  margin: 0 10px;
  color: #666666;
}

@media (max-width: 800px) {
  .mobile-hidden {
    display: none;
  }

  .ieee-meta-nav {
    padding: 8px 5%;
    font-size: 0.75em;
  }
}
```

---

### 2. Site Header & Master Brand / Sub-Brand Lockup

Directly below `MetaNav`, the application's primary `<header>` provides local site navigation and brand orientation:

*   **Brand Lockup (Left):** Pair the site/project title (set in `var(--font-heading)`, `1.25rem`, `font-weight: 700`) with the official **IEEE Master Brand** (the IEEE kite + wordmark) or the sponsoring **Organizational Unit (OU) sub-brand logo** (e.g., `IEEE Students`).
*   **Proportions & Clear Space:** Separate the site title and official logo with a subtle visual separator (e.g., `×` at `0.85rem` muted opacity, `gap: 0.6rem`) and constrain the logo height (`height: 22px; width: auto; object-fit: contain`) so neither crowds nor distorts the official mark.
*   **Logo Integrity:** Never stretch, recolor, or crop official IEEE or OU logos. Ensure the chosen logo asset maintains clear legibility across both dark and light themes.

```jsx
<Link to="/" className="brand-group">
  <span className="brand-text">Project Title</span>
  <span className="brand-separator">×</span>
  <img src="/logos/ieee-subbrand-logo.png" alt="IEEE Organizational Unit" className="brand-logo" />
</Link>
```

---

### 3. IEEE Global Compliance Footer (`Footer`)

Every official IEEE web page must terminate with the global compliance footer containing mandated policy links and the corporate copyright/charity statement.

*   **Visual Rules:** Centered layout (`padding: 30px 5%`), `border-top: 1px solid var(--card-border)`, `font-family: Verdana, Arial, Helvetica, sans-serif`, `font-size: 0.9em`, adapting cleanly to dark and light themes via CSS custom properties (`var(--card-bg)`, `var(--text-main)`, `var(--text-muted)`, hover `var(--primary)`).
*   **Mandatory Policy & Utility Links** (separated by `|` on desktop; stacked vertically in a single column with dividers hidden at `<= 800px`):
    1.  `Home` → `http://www.ieee.org/index.html`
    2.  `Sitemap` → `http://www.ieee.org/sitemap.html`
    3.  `Contact & Support` → `http://www.ieee.org/about/contact_center/index.html`
    4.  `Accessibility` → `http://www.ieee.org/accessibility_statement.html`
    5.  `Nondiscrimination Policy` → `http://www.ieee.org/p9-26.html`
    6.  `IEEE Ethics Reporting` → `http://ieee-ethics-reporting.org/`
    7.  `IEEE Privacy Policy` → `http://www.ieee.org/security_privacy.html`
    8.  `Terms & Disclosures` → `https://www.ieee.org/about/help/site-terms-conditions.html`
    9.  `Feedback` → `https://www.ieee.org/about/feedback-ieee-site.html`
*   **Mandatory Copyright & Charity Statement:** Must render the current year dynamically alongside the exact IEEE public charity boilerplate:
    > `© Copyright <YYYY> IEEE - All rights reserved. A public charity, IEEE is the world's largest technical professional organization dedicated to advancing technology for the benefit of humanity.`

#### Reference Markup (`Footer.jsx`)
```jsx
const Footer = () => (
  <footer className="ieee-footer">
    <div className="footer-links">
      <a href="http://www.ieee.org/index.html">Home</a>
      <span className="divider">|</span>
      <a href="http://www.ieee.org/sitemap.html">Sitemap</a>
      <span className="divider">|</span>
      <a href="http://www.ieee.org/about/contact_center/index.html">Contact & Support</a>
      <span className="divider">|</span>
      <a href="http://www.ieee.org/accessibility_statement.html">Accessibility</a>
      <span className="divider">|</span>
      <a href="http://www.ieee.org/p9-26.html">Nondiscrimination Policy</a>
      <span className="divider">|</span>
      <a href="http://ieee-ethics-reporting.org/">IEEE Ethics Reporting</a>
      <span className="divider">|</span>
      <a href="http://www.ieee.org/security_privacy.html">IEEE Privacy Policy</a>
      <span className="divider">|</span>
      <a href="https://www.ieee.org/about/help/site-terms-conditions.html">Terms & Disclosures</a>
      <span className="divider">|</span>
      <a href="https://www.ieee.org/about/feedback-ieee-site.html">Feedback</a>
    </div>
    <p className="copyright">
      &copy; Copyright {new Date().getFullYear()} IEEE - All rights reserved. A public charity, IEEE is the world&apos;s largest technical professional organization dedicated to advancing technology for the benefit of humanity.
    </p>
  </footer>
);
```

#### Reference Styles (`Footer.css`)
```css
.ieee-footer {
  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-size: 0.9em;
  color: var(--text-muted, #94a3b8);
  background: var(--card-bg, rgba(30, 41, 59, 0.6));
  backdrop-filter: var(--glass-blur, blur(12px));
  -webkit-backdrop-filter: var(--glass-blur, blur(12px));
  padding: 30px 5%;
  border-top: 1px solid var(--card-border, rgba(255, 255, 255, 0.08));
  text-align: center;
  margin-top: auto;
}

.ieee-footer .footer-links {
  margin-bottom: 20px;
}

.ieee-footer a {
  color: var(--text-main, #f8fafc);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.ieee-footer a:hover {
  text-decoration: underline;
  color: var(--primary, #00629B);
}

.ieee-footer .divider {
  margin: 0 10px;
  opacity: 0.5;
}

.ieee-footer .copyright {
  line-height: 1.5;
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 800px) {
  .ieee-footer .footer-links {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .ieee-footer .divider {
    display: none;
  }
}
```

---

### 4. Browser Brand Metadata & Favicons

Include official IEEE wordmark/kite favicons and set the brand tile/mask color to IEEE Blue (`#00629b`) in `<head>`:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00629b">
<meta name="msapplication-TileColor" content="#00629b">
```
