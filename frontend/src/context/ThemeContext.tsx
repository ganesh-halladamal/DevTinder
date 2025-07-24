import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Add a transition state to enable smooth animations
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Add transition class to the root element
    document.documentElement.classList.add('color-theme-in-transition');
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
    
    // Apply premium theme styles
    if (theme === 'dark') {
      // Premium dark mode with subtle blue/purple tint
      document.documentElement.style.setProperty('--background', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--foreground', '210 40% 98%');
      
      // Enhance muted text contrast for better visibility in dark mode
      document.documentElement.style.setProperty('--muted-foreground', '215 20.2% 75.1%');
      
      // Set card and content backgrounds darker with slight gradient
      document.documentElement.style.setProperty('--card', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--card-foreground', '210 40% 98%');
      
      // Primary color with subtle gradient
      document.documentElement.style.setProperty('--primary', '210 40% 98%');
      document.documentElement.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
      
      // Accent colors with more pop
      document.documentElement.style.setProperty('--accent', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--accent-foreground', '210 40% 98%');
      
      // Improved border contrast
      document.documentElement.style.setProperty('--border', '217.2 32.6% 20.5%');
      
      document.documentElement.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)';
      document.documentElement.style.color = 'hsl(210, 40%, 98%)';
      
      // Add subtle texture to dark mode
      document.documentElement.style.backgroundImage = 'radial-gradient(hsla(217.2, 32.6%, 17.5%, 0.8) 1px, transparent 0)';
      document.documentElement.style.backgroundSize = '40px 40px';
    } else {
      // Premium light mode with subtle warm tint
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '222.2 84% 4.9%');
      
      // Warmer muted tones
      document.documentElement.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
      
      // Card with subtle shadow
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '222.2 84% 4.9%');
      
      // Primary with more contrast
      document.documentElement.style.setProperty('--primary', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
      
      // Accent with slight warmth
      document.documentElement.style.setProperty('--accent', '210 40% 96.1%');
      document.documentElement.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
      
      // Softer border
      document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
      
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.color = '#000000';
      
      // Remove texture from light mode
      document.documentElement.style.backgroundImage = 'none';
    }
    
    // Remove transition class after the transition is complete
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.remove('color-theme-in-transition');
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [theme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};