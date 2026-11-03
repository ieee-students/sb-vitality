import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MetaNav } from "./components/MetaNav";
import { ScopeBar } from "./components/ScopeBar";
import { DashboardPage } from "./pages/DashboardPage";
import { HelpPage } from "./pages/HelpPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { useAppState } from "./state/AppState";

function RequireData() {
  const { status, model } = useAppState();
  if (status === "loading") {
    return (
      <div className="page">
        <p className="loading">Loading the file stored in this browser…</p>
      </div>
    );
  }
  if (!model) return <OnboardingPage />;
  return <Outlet />;
}

function Frame() {
  const { pathname } = useLocation();
  const showScope = pathname !== "/how-to-export";
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <MetaNav />
      <div className="sticky-top">
        <Header />
        {showScope ? <ScopeBar /> : null}
      </div>
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Frame />}>
        <Route path="how-to-export" element={<HelpPage />} />
        <Route element={<RequireData />}>
          <Route index element={<DashboardPage />} />
          <Route path=":regionCode" element={<DashboardPage />} />
          <Route path=":regionCode/:sectionSlug" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
