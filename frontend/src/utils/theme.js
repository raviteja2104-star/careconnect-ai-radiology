// CareConnect Design System
export const COLORS = {
    // Primary palette - Medical teal/cyan
    primary: '#00BFA6',
    primaryDark: '#009688',
    primaryLight: '#4DD0C8',
    primaryGlow: 'rgba(0, 191, 166, 0.15)',

    // Secondary palette
    secondary: '#1E88E5',
    secondaryDark: '#1565C0',
    secondaryLight: '#64B5F6',

    // Background (Dark theme)
    background: '#0A1628',
    backgroundSecondary: '#0F1F38',
    card: '#152238',
    cardElevated: '#1A2B45',
    surface: '#1E3350',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A0B4C8',
    textMuted: '#6B8299',
    textInverse: '#0A1628',

    // Semantic
    success: '#4CAF50',
    warning: '#FFA726',
    danger: '#EF5350',
    info: '#42A5F5',

    // Risk levels
    riskLow: '#4CAF50',
    riskMedium: '#FFA726',
    riskHigh: '#EF5350',
    riskCritical: '#D32F2F',

    // Gradient presets
    gradientPrimary: ['#00BFA6', '#009688'],
    gradientSecondary: ['#1E88E5', '#1565C0'],
    gradientDanger: ['#EF5350', '#D32F2F'],
    gradientDark: ['#152238', '#0A1628'],
    gradientCard: ['rgba(21, 34, 56, 0.9)', 'rgba(10, 22, 40, 0.95)'],

    // Misc
    border: '#243B55',
    divider: '#1E3350',
    overlay: 'rgba(0, 0, 0, 0.6)',
    white: '#FFFFFF',
    black: '#000000',
};

export const FONTS = {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    semiBold: { fontFamily: 'System', fontWeight: '600' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    extraBold: { fontFamily: 'System', fontWeight: '800' },
};

export const SIZES = {
    // Font sizes
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    heading: 28,
    title: 32,
    hero: 40,

    // Spacing
    padding: 16,
    paddingLg: 24,
    paddingSm: 8,
    margin: 16,
    marginLg: 24,
    radius: 12,
    radiusSm: 8,
    radiusLg: 16,
    radiusXl: 24,
    radiusFull: 999,

    // Shadows
    shadowSm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    shadowMd: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    shadowLg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
};
