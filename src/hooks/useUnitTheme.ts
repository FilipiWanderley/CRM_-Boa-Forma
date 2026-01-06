import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUnits } from '@/hooks/useUnits';

// Convert HEX to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Generate color variations
function generateColorVariations(hsl: { h: number; s: number; l: number }) {
  return {
    primary: `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    primaryForeground: hsl.l > 50 ? '220 20% 10%' : '0 0% 100%',
    primaryGlow: `${hsl.h} ${Math.min(hsl.s + 10, 100)}% ${Math.min(hsl.l + 15, 90)}%`,
    ring: `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    accent: `${hsl.h} ${Math.max(hsl.s - 20, 20)}% ${Math.min(hsl.l + 25, 95)}%`,
    accentForeground: `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 30, 20)}%`,
  };
}

// Map font names to Google Fonts URLs
const fontUrls: Record<string, string> = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
  'Raleway': 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap',
};

// Load Google Font dynamically
function loadGoogleFont(fontFamily: string) {
  const fontUrl = fontUrls[fontFamily];
  if (!fontUrl) return;

  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  document.head.appendChild(link);
}

// Apply font family to document
function applyFont(fontFamily: string) {
  loadGoogleFont(fontFamily);
  document.documentElement.style.setProperty('--font-family', `"${fontFamily}", system-ui, sans-serif`);
  document.body.style.fontFamily = `"${fontFamily}", system-ui, sans-serif`;
}

// Apply favicon to document
function applyFavicon(faviconUrl: string | null) {
  // Find existing favicon links
  const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  
  if (faviconUrl) {
    existingLinks.forEach(link => link.remove());
    
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 
                faviconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    document.head.appendChild(link);
    
    localStorage.setItem('unit-favicon-url', faviconUrl);
  }
}

// Check if dark mode is active
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

// Apply dark theme colors
function applyDarkThemeColors(
  darkPrimaryColor: string | null,
  darkBackgroundColor: string | null,
  darkAccentColor: string | null,
  fallbackPrimaryColor: string
) {
  const root = document.documentElement;
  
  // Get or create style element for dark theme overrides
  let styleEl = document.getElementById('unit-dark-theme-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'unit-dark-theme-styles';
    document.head.appendChild(styleEl);
  }

  const primaryColor = darkPrimaryColor || fallbackPrimaryColor;
  const primaryHsl = hexToHSL(primaryColor);
  
  let cssRules = '.dark {\n';
  
  if (primaryHsl) {
    const colors = generateColorVariations(primaryHsl);
    cssRules += `  --primary: ${colors.primary};\n`;
    cssRules += `  --primary-foreground: ${colors.primaryForeground};\n`;
    cssRules += `  --ring: ${colors.ring};\n`;
  }
  
  if (darkBackgroundColor) {
    const bgHsl = hexToHSL(darkBackgroundColor);
    if (bgHsl) {
      cssRules += `  --background: ${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%;\n`;
      // Adjust foreground based on background lightness
      cssRules += `  --foreground: 0 0% ${bgHsl.l < 20 ? 98 : 95}%;\n`;
      // Card and other surface colors
      const cardL = Math.min(bgHsl.l + 5, 20);
      cssRules += `  --card: ${bgHsl.h} ${bgHsl.s}% ${cardL}%;\n`;
      cssRules += `  --card-foreground: 0 0% ${bgHsl.l < 20 ? 98 : 95}%;\n`;
      const mutedL = Math.min(bgHsl.l + 10, 25);
      cssRules += `  --muted: ${bgHsl.h} ${bgHsl.s}% ${mutedL}%;\n`;
    }
  }
  
  if (darkAccentColor) {
    const accentHsl = hexToHSL(darkAccentColor);
    if (accentHsl) {
      cssRules += `  --accent: ${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%;\n`;
      cssRules += `  --accent-foreground: ${accentHsl.l > 50 ? '220 20% 10%' : '0 0% 100%'};\n`;
    }
  }
  
  cssRules += '}\n';
  
  styleEl.textContent = cssRules;
  
  // Store in localStorage
  localStorage.setItem('unit-dark-theme', JSON.stringify({
    darkPrimaryColor,
    darkBackgroundColor,
    darkAccentColor,
    fallbackPrimaryColor,
  }));
}

export function useUnitTheme() {
  const { profile } = useAuth();
  const { data: units } = useUnits();

  const currentUnit = useMemo(() => {
    if (!profile?.unit_id || !units) return null;
    return units.find(u => u.id === profile.unit_id);
  }, [profile?.unit_id, units]);

  // Apply light theme primary color
  useEffect(() => {
    if (!currentUnit?.primary_color) return;

    const hsl = hexToHSL(currentUnit.primary_color);
    if (!hsl) return;

    const colors = generateColorVariations(hsl);
    
    // Create style element for light theme
    let styleEl = document.getElementById('unit-light-theme-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'unit-light-theme-styles';
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `:root {\n  --primary: ${colors.primary};\n  --primary-foreground: ${colors.primaryForeground};\n  --ring: ${colors.ring};\n}\n`;
    
    // Store in localStorage for persistence
    localStorage.setItem('unit-primary-color', currentUnit.primary_color);
  }, [currentUnit?.primary_color]);

  // Apply dark theme colors
  useEffect(() => {
    const unit = currentUnit as any;
    if (!unit) return;

    applyDarkThemeColors(
      unit.dark_primary_color,
      unit.dark_background_color,
      unit.dark_accent_color,
      unit.primary_color || '#3B82F6'
    );
  }, [
    (currentUnit as any)?.dark_primary_color,
    (currentUnit as any)?.dark_background_color,
    (currentUnit as any)?.dark_accent_color,
    currentUnit?.primary_color,
  ]);

  // Apply font family
  useEffect(() => {
    const fontFamily = (currentUnit as any)?.font_family || 'Inter';
    applyFont(fontFamily);
    localStorage.setItem('unit-font-family', fontFamily);
  }, [(currentUnit as any)?.font_family]);

  // Apply favicon
  useEffect(() => {
    const faviconUrl = (currentUnit as any)?.favicon_url;
    if (faviconUrl) {
      applyFavicon(faviconUrl);
    }
  }, [(currentUnit as any)?.favicon_url]);

  return {
    unit: currentUnit,
    primaryColor: currentUnit?.primary_color || '#3B82F6',
    logoUrl: currentUnit?.logo_url,
    fontFamily: (currentUnit as any)?.font_family || 'Inter',
    faviconUrl: (currentUnit as any)?.favicon_url,
    darkPrimaryColor: (currentUnit as any)?.dark_primary_color,
    darkBackgroundColor: (currentUnit as any)?.dark_background_color,
    darkAccentColor: (currentUnit as any)?.dark_accent_color,
  };
}

// Apply saved theme on initial load (before React hydration)
export function applyStoredUnitTheme() {
  // Apply saved light theme
  const savedColor = localStorage.getItem('unit-primary-color');
  if (savedColor) {
    const hsl = hexToHSL(savedColor);
    if (hsl) {
      const colors = generateColorVariations(hsl);
      let styleEl = document.getElementById('unit-light-theme-styles') as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'unit-light-theme-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `:root {\n  --primary: ${colors.primary};\n  --primary-foreground: ${colors.primaryForeground};\n  --ring: ${colors.ring};\n}\n`;
    }
  }

  // Apply saved dark theme
  const savedDarkTheme = localStorage.getItem('unit-dark-theme');
  if (savedDarkTheme) {
    try {
      const { darkPrimaryColor, darkBackgroundColor, darkAccentColor, fallbackPrimaryColor } = JSON.parse(savedDarkTheme);
      applyDarkThemeColors(darkPrimaryColor, darkBackgroundColor, darkAccentColor, fallbackPrimaryColor);
    } catch (e) {
      console.error('Failed to parse dark theme from localStorage');
    }
  }

  // Apply saved font
  const savedFont = localStorage.getItem('unit-font-family');
  if (savedFont) {
    applyFont(savedFont);
  }

  // Apply saved favicon
  const savedFavicon = localStorage.getItem('unit-favicon-url');
  if (savedFavicon) {
    applyFavicon(savedFavicon);
  }
}
