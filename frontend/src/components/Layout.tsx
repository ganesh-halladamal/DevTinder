import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';
import { Menu, X, Sun, Moon } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isTransitioning } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Add scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'md:bg-background/95 md:backdrop-blur-md bg-background shadow-md' 
          : 'bg-background'
      } border-b border-border`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-black dark:text-white">
              <span className="hidden md:inline">DevTinder</span>
              <span className="md:hidden">DevTinder</span>
            </Link>

            {/* Mobile Controls - Theme Toggle + Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors ${isTransitioning ? 'animate-[themeToggle_0.5s_ease-in-out]' : ''}`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-500" />}
              </button>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Discover
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                  isActive('/') ? 'scale-x-100' : ''
                }`}></span>
              </Link>
              <Link
                to="/matches"
                className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                  isActive('/matches') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Matches
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                  isActive('/matches') ? 'scale-x-100' : ''
                }`}></span>
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                  isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Profile
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                  isActive('/profile') ? 'scale-x-100' : ''
                }`}></span>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors ${isTransitioning ? 'animate-[themeToggle_0.5s_ease-in-out]' : ''}`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-500" />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={logout}
                  className="text-sm font-medium px-4 py-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-2 border-t border-border animate-accordion-down bg-background/95 backdrop-blur-md rounded-b-lg shadow-lg">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-2 text-sm font-medium transition-colors hover:bg-accent/50 rounded-md ${
                    isActive('/') ? 'text-primary bg-accent/30' : 'text-muted-foreground'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  to="/matches"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-2 text-sm font-medium transition-colors hover:bg-accent/50 rounded-md ${
                    isActive('/matches') ? 'text-primary bg-accent/30' : 'text-muted-foreground'
                  }`}
                >
                  Matches
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-2 text-sm font-medium transition-colors hover:bg-accent/50 rounded-md ${
                    isActive('/profile') ? 'text-primary bg-accent/30' : 'text-muted-foreground'
                  }`}
                >
                  Profile
                </Link>
                
                <div className="flex items-center justify-between py-2 px-2 mt-2 border-t border-border">
                  <button
                    onClick={logout}
                    className="py-2 px-4 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors rounded-full"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content - Add padding top to account for fixed navbar */}
      <main className="container mx-auto px-4 py-8 flex-grow pt-24">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm font-semibold text-muted-foreground text-center">
            No rights reserved. If it breaks, blame <a 
              href="https://www.linkedin.com/in/ganesh-halladamal/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-pink-500 dark:text-pink-400 premium-link"
            >
              Ganesh Halladamal
            </a>, not the bugs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 