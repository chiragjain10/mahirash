import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const navLinks = [
  { label: 'Home', to: '/', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { label: 'Brands', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  ), megaMenu: true },
  { label: 'Shop', to: '/category', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M6 6h15l-1.5 9h-13L4 2H1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="20" r="1" stroke="currentColor" strokeWidth="0.9"/>
      <circle cx="18" cy="20" r="1" stroke="currentColor" strokeWidth="0.9"/>
    </svg>
  ) },
  
 
  { label: 'Our Story', to: '/about', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { label: 'Contact Us', to: '/contact', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
];

export default function Menu({ drawerOpen, setDrawerOpen }) {
  const location = useLocation();
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [brands, setBrands] = useState([]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unique brands from Firestore products
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const all = snapshot.docs
          .map(d => (d.data()?.brand || '').toString().trim())
          .filter(Boolean);
        const unique = Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
        setBrands(unique);
      } catch (e) {
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  // Helper to detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 991;

  // Hamburger icon (moved to BottomHeader)
  const Hamburger = (
    <button
      className="mahirash-hamburger"
      aria-label="Open menu"
      onClick={() => setDrawerOpen(true)}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );

  // Mobile Drawer
  const Drawer = (
    <div className={`mahirash-mobile-drawer${drawerOpen ? ' open' : ''}`}>
      <button
        className="mahirash-drawer-close"
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
      >
        &times;
      </button>
      <ul className="mahirash-mobile-menu-list border">
        {navLinks.map(link => (
          <li key={link.label}>
            {link.megaMenu ? (
              <>
                <button
                  className="mahirash-mobile-accordion-btn"
                  onClick={() => setMobileCategoriesOpen(open => !open)}
                  aria-expanded={mobileCategoriesOpen}
                >
                  {link.label}
                  <span className={`arrow${mobileCategoriesOpen ? ' open' : ''}`}></span>
                </button>
                {mobileCategoriesOpen && (
                  <div className="mahirash-mobile-accordion-panel">
                    <ul className="mahirash-mobile-brand-list">
                      {brands.length > 0 ? (
                        brands.slice(0, 15).map(brand => (
                          <li key={brand}>
                            <Link 
                              to={`/category?brand=${encodeURIComponent(brand)}`} 
                              className="mahirash-mobile-accordion-link"
                              onClick={() => setDrawerOpen(false)}
                            >
                              {brand}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="mahirash-mobile-accordion-link">No brands found</li>
                      )}
                      <li className="mahirash-mobile-divider"></li>
                      <li>
                        <Link 
                          to="/category" 
                          className="mahirash-mobile-accordion-link all-brands"
                          onClick={() => setDrawerOpen(false)}
                        >
                          View All Brands
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <Link
                to={link.to}
                className={
                  'mahirash-nav-link' + (location.pathname === link.to ? ' active' : '')
                }
                onClick={() => setDrawerOpen(false)}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <nav className={`mahirash-menu-bar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Main nav for desktop */}
        <ul className="mahirash-menu-list">
          {navLinks.map(link => (
            <li
              key={link.label}
              className={link.megaMenu ? 'mahirash-categories-nav' : ''}
              onMouseEnter={link.megaMenu ? () => setShowMegaMenu(true) : undefined}
              onMouseLeave={link.megaMenu ? () => setShowMegaMenu(false) : undefined}
              style={{ position: 'relative' }}
            >
              <Link
                to={link.to}
                className={
                  'mahirash-nav-link' + (location.pathname === link.to ? ' active' : '')
                }
                // Remove the onClick handler for toggling megamenu
              >
                {link.label}
                {link.megaMenu && <i className="mahirash-dropdown-icon">▼</i>}
              </Link>
              {/* Simple Dropdown */}
              {link.megaMenu && showMegaMenu && (
                <div
                  className="mahirash-simple-dropdown"
                  onMouseEnter={() => setShowMegaMenu(true)}
                  onMouseLeave={() => setShowMegaMenu(false)}
                >
                  <ul className="mahirash-dropdown-items">
                    {brands.length > 0 ? (
                      brands.slice(0, 15).map(brand => (
                        <li key={brand} className="mahirash-dropdown-item">
                          <Link 
                            to={`/category?brand=${encodeURIComponent(brand)}`} 
                            className="mahirash-dropdown-link"
                          >
                            {brand}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="mahirash-dropdown-item">No brands found</li>
                    )}
                    <li className="mahirash-dropdown-divider"></li>
                    <li className="mahirash-dropdown-item">
                      <Link to="/category" className="mahirash-dropdown-link all-brands">
                        View All Brands
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* Mobile Drawer */}
        {Drawer}
      </div>
    </nav>
  );
}

// BottomHeader component for mobile only
export function BottomHeader() {
  const location = useLocation();
  const [showCategories, setShowCategories] = useState(false);
  const [brands, setBrands] = useState([]);

  // Fetch unique brands for bottom sheet as well
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const all = snapshot.docs
          .map(d => (d.data()?.brand || '').toString().trim())
          .filter(Boolean);
        const unique = Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
        setBrands(unique);
      } catch (e) {
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  // Filter out 'Home' for mobile bottom header
const mobileNavLinks = navLinks.filter(link => link.label !== 'Home');


  return (
    <>
      <div className="mahirash-bottom-header">
        <div className="mahirash-bottom-header-inner">
          {mobileNavLinks.map(link =>
            link.megaMenu ? (
              <button
                key={link.label}
                className={"mahirash-bottom-header-btn" + (showCategories ? " active" : "")}
                onClick={() => setShowCategories(open => !open)}
                aria-expanded={showCategories}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className={"mahirash-bottom-header-btn" + (location.pathname === link.to ? " active" : "")}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          )}
        </div>
      </div>
      {/* Brands bottom sheet/expandable */}
      {showCategories && (
        <div className="mahirash-bottom-categories-sheet" onClick={() => setShowCategories(false)}>
          <div className="mahirash-bottom-categories-sheet-inner" onClick={e => e.stopPropagation()}>
            <h4>Brands</h4>
            <div className="mahirash-bottom-categories-list">
              {/* Brands */}
              {brands.length > 0 ? (
                <div className="mahirash-bottom-category">
                  <div className="mahirash-bottom-category-title">Popular Brands</div>
                  <ul>
                    {brands.slice(0, 20).map(b => (
                      <li key={b}>
                        <Link
                          to={`/category?brand=${encodeURIComponent(b)}`}
                          className="mahirash-mobile-accordion-link"
                          onClick={() => setShowCategories(false)}
                        >
                          {b}
                        </Link>
                      </li>
                    ))}
                    <li className="mahirash-mobile-divider"></li>
                    <li>
                      <Link 
                        to="/category" 
                        className="mahirash-mobile-accordion-link all-brands"
                        onClick={() => setShowCategories(false)}
                      >
                        View All Brands
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : (
                <p style={{ padding: '20px', textAlign: 'center' }}>No brands found</p>
              )}
            </div>
            <button className="mahirash-bottom-categories-close" onClick={() => setShowCategories(false)}>&times;</button>
          </div>
        </div>
      )}
    </>
  );
} 