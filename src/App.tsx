import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Cleaner from './pages/Cleaner';
import Vault from './pages/Vault';
import CookMode from './pages/CookMode';
import FamilyVault from './pages/FamilyVault';
import Pricing from './pages/Pricing';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Cook mode gets a full-screen, navbar-free layout */}
        <Route path="/cook/:id" element={<CookMode />} />

        {/* All other routes use the standard layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/cleaner" element={<Cleaner />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/family-vault" element={<FamilyVault />} />
                <Route path="/pricing" element={<Pricing />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </>
  );
}
