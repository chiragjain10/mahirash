import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const baseCategories = ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'];

const navLinks = [
  { label: 'Home', to: '/', icon: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { label: 'Categories', icon: (
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
  const [categories, setCategories] = useState(baseCategories);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unique categories from Firestore metadata
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docRef = doc(db, 'metadata', 'lists');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const customCategories = docSnap.data()?.categories || [];
          const unique = [...new Set([...baseCategories, ...customCategories])].sort((a, b) => a.localeCompare(b));
          setCategories(unique);
        } else {
          setCategories(baseCategories);
        }
      } catch (e) {
        console.error("Error fetching categories:", e);
        setCategories(baseCategories);
      }
    };
    fetchCategories();
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
                      {categories.length > 0 ? (
                        categories.map(cat => (
                          <li key={cat}>
                            <Link 
                              to={`/category/${encodeURIComponent(cat)}`} 
                              className="mahirash-mobile-accordion-link"
                              onClick={() => setDrawerOpen(false)}
                            >
                              {cat}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="mahirash-mobile-accordion-link">No categories found</li>
                      )}
                      <li className="mahirash-mobile-divider"></li>
                      <li>
                        <Link 
                          to="/category" 
                          className="mahirash-mobile-accordion-link all-brands"
                          onClick={() => setDrawerOpen(false)}
                        >
                          View All Categories
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
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <li key={cat} className="mahirash-dropdown-item">
                          <Link 
                            to={`/category/${encodeURIComponent(cat)}`} 
                            className="mahirash-dropdown-link"
                          >
                            {cat}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="mahirash-dropdown-item">No categories found</li>
                    )}
                    <li className="mahirash-dropdown-divider"></li>
                    <li className="mahirash-dropdown-item">
                      <Link to="/category" className="mahirash-dropdown-link all-brands">
                        View All Categories
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
  const [categories, setCategories] = useState(baseCategories);

  // Fetch unique categories for bottom sheet as well
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docRef = doc(db, 'metadata', 'lists');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const customCategories = docSnap.data()?.categories || [];
          const unique = [...new Set([...baseCategories, ...customCategories])].sort((a, b) => a.localeCompare(b));
          setCategories(unique);
        } else {
          setCategories(baseCategories);
        }
      } catch (e) {
        console.error("Error fetching categories:", e);
        setCategories(baseCategories);
      }
    };
    fetchCategories();
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
      {/* Categories bottom sheet/expandable */}
      {showCategories && (
        <div className="mahirash-bottom-categories-sheet" onClick={() => setShowCategories(false)}>
          <div className="mahirash-bottom-categories-sheet-inner" onClick={e => e.stopPropagation()}>
            <h4>Categories</h4>
            <div className="mahirash-bottom-categories-list">
              {/* Categories */}
              {categories.length > 0 ? (
                <div className="mahirash-bottom-category">
                  <div className="mahirash-bottom-category-title">All Categories</div>
                  <ul>
                    {categories.map(cat => (
                      <li key={cat}>
                        <Link
                          to={`/category/${encodeURIComponent(cat)}`}
                          className="mahirash-mobile-accordion-link"
                          onClick={() => setShowCategories(false)}
                        >
                          {cat}
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
                        View All Categories
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : (
                <p style={{ padding: '20px', textAlign: 'center' }}>No categories found</p>
              )}
            </div>
            <button className="mahirash-bottom-categories-close" onClick={() => setShowCategories(false)}>&times;</button>
          </div>
        </div>
      )}
    </>
  );
} 