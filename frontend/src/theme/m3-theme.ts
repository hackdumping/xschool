import { createTheme } from '@mui/material/styles';
import type { ThemeOptions, PaletteMode } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

// Material Design 3 Color Tokens based on seed color #2E7D32 (Green 800)
export const getM3Tokens = (mode: PaletteMode) => {
  const isDark = mode === 'dark';
  
  return {
    // Primary colors
    primary: isDark ? '#A5D6A7' : '#2E7D32',
    onPrimary: isDark ? '#003300' : '#FFFFFF',
    primaryContainer: isDark ? '#1B5E20' : '#DEF8DC',
    onPrimaryContainer: isDark ? '#DEF8DC' : '#002200',
    
    // Secondary colors (Amber 700)
    secondary: isDark ? '#FFD54F' : '#F9A825',
    onSecondary: isDark ? '#3D2E00' : '#000000',
    secondaryContainer: isDark ? '#5D4037' : '#FFF8E1',
    onSecondaryContainer: isDark ? '#FFF8E1' : '#3D2E00',
    
    // Tertiary colors
    tertiary: isDark ? '#81C784' : '#4CAF50',
    onTertiary: isDark ? '#002200' : '#FFFFFF',
    tertiaryContainer: isDark ? '#2E7D32' : '#C8E6C9',
    onTertiaryContainer: isDark ? '#C8E6C9' : '#002200',
    
    // Error colors
    error: isDark ? '#EF5350' : '#D32F2F',
    onError: isDark ? '#3D0000' : '#FFFFFF',
    errorContainer: isDark ? '#B71C1C' : '#FFEBEE',
    onErrorContainer: isDark ? '#FFEBEE' : '#3D0000',
    
    // Surface colors
    surface: isDark ? '#1E1E1E' : '#FDFDFD',
    onSurface: isDark ? '#E0E0E0' : '#1E1E1E',
    surfaceVariant: isDark ? '#2D2D2D' : '#E0E4E0',
    onSurfaceVariant: isDark ? '#B0B0B0' : '#4A4A4A',
    
    // Background
    background: isDark ? '#121212' : '#FAFAFA',
    onBackground: isDark ? '#E0E0E0' : '#1E1E1E',
    
    // Outline
    outline: isDark ? '#616161' : '#9E9E9E',
    outlineVariant: isDark ? '#424242' : '#E0E0E0',
    
    // Inverse
    inverseSurface: isDark ? '#E0E0E0' : '#1E1E1E',
    inverseOnSurface: isDark ? '#1E1E1E' : '#E0E0E0',
    inversePrimary: isDark ? '#2E7D32' : '#A5D6A7',
    
    // Elevation surface tints (for dark mode)
    elevation: {
      level0: isDark ? '#121212' : '#FAFAFA',
      level1: isDark ? '#1E1E1E' : '#FFFFFF',
      level2: isDark ? '#232323' : '#F5F5F5',
      level3: isDark ? '#252525' : '#F0F0F0',
      level4: isDark ? '#272727' : '#EEEEEE',
      level5: isDark ? '#2A2A2A' : '#ECECEC',
    },
    
    // Status colors
    success: isDark ? '#81C784' : '#4CAF50',
    warning: isDark ? '#FFB74D' : '#FF9800',
    info: isDark ? '#64B5F6' : '#2196F3',
    
    // Gradients
    gradients: {
      primary: isDark 
        ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' 
        : 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
      secondary: 'linear-gradient(135deg, #F9A825 0%, #FBC02D 100%)',
      surface: isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)',
    },
    
    // Custom shadows
    premiumShadows: {
      soft: '0 8px 32px rgba(0,0,0,0.06)',
      strong: '0 12px 48px rgba(0,0,0,0.12)',
      active: '0 4px 12px rgba(46, 125, 50, 0.2)',
    }
  };
};

// Typography scale following Material Design 3
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  
  // Display styles
  displayLarge: {
    fontSize: '3.5rem',
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  displayMedium: {
    fontSize: '2.8rem',
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
  },
  displaySmall: {
    fontSize: '2.25rem',
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: '0em',
  },
  
  // Headline styles
  headlineLarge: {
    fontSize: '2rem',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '0em',
  },
  headlineMedium: {
    fontSize: '1.75rem',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '0.00735em',
  },
  headlineSmall: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: '0em',
  },
  
  // Title styles
  titleLarge: {
    fontSize: '1.375rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  titleMedium: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.00937em',
  },
  titleSmall: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.00625em',
  },
  
  // Label styles
  labelLarge: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.00714em',
  },
  labelMedium: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.025em',
  },
  labelSmall: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.03571em',
  },
  
  // Body styles
  bodyLarge: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00937em',
  },
  bodyMedium: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.01786em',
  },
  bodySmall: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.025em',
  },
};

// Shape (corner radius) following M3
const shape = {
  borderRadius: 12,
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,
  borderRadiusXLarge: 28,
  borderRadiusFull: 9999,
};

// Elevation shadows
const elevation = {
  level0: 'none',
  level1: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
  level2: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
  level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
  level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
  level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
};

export const createM3Theme = (mode: PaletteMode = 'light'): ThemeOptions => {
  const tokens = getM3Tokens(mode);
  
  return {
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        contrastText: tokens.onPrimary,
        light: tokens.primaryContainer,
        dark: tokens.inversePrimary,
      },
      secondary: {
        main: tokens.secondary,
        contrastText: tokens.onSecondary,
        light: tokens.secondaryContainer,
      },
      error: {
        main: tokens.error,
        contrastText: tokens.onError,
        light: tokens.errorContainer,
      },
      background: {
        default: tokens.background,
        paper: tokens.surface,
      },
      text: {
        primary: tokens.onSurface,
        secondary: tokens.onSurfaceVariant,
      },
      divider: tokens.outline,
      success: {
        main: tokens.success,
      },
      warning: {
        main: tokens.warning,
      },
      info: {
        main: tokens.info,
      },
    },
    typography: {
      fontFamily: typography.fontFamily,
      // Map M3 typography to MUI variants
      h1: typography.displayLarge,
      h2: typography.displayMedium,
      h3: typography.displaySmall,
      h4: typography.headlineLarge,
      h5: typography.headlineMedium,
      h6: typography.headlineSmall,
      subtitle1: typography.titleLarge,
      subtitle2: typography.titleMedium,
      body1: typography.bodyLarge,
      body2: typography.bodyMedium,
      button: typography.labelLarge,
      caption: typography.bodySmall,
      overline: typography.labelSmall,
    },
    shape: {
      borderRadius: shape.borderRadius,
    },
    shadows: [
      'none',
      elevation.level1,
      elevation.level1,
      elevation.level2,
      elevation.level2,
      elevation.level3,
      elevation.level3,
      elevation.level4,
      elevation.level4,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
      elevation.level5,
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 24px',
          },
          contained: {
            boxShadow: elevation.level1,
            '&:hover': {
              boxShadow: elevation.level2,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: tokens.gradients.surface,
            border: `1px solid ${tokens.outlineVariant}`,
            boxShadow: elevation.level1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: elevation.level3,
              transform: 'translateY(-4px)',
              borderColor: tokens.primary,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            height: 32,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadiusLarge,
            boxShadow: elevation.level3,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.borderRadiusSmall,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: shape.borderRadiusLarge,
            boxShadow: elevation.level3,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: tokens.surfaceVariant,
              borderRadius: `${shape.borderRadiusSmall}px`,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${tokens.outlineVariant}`,
            },
          },
        },
      },
    },
  };
};

export const m3Theme = (mode: PaletteMode = 'light') => createTheme(createM3Theme(mode));
