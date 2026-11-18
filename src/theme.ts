import { alpha, createTheme } from '@mui/material/styles';

// Values taken from axis.bank.in (computed styles): Lato, burgundy #97144D, #F1F4F7 sections.
export const brand = {
  burgundy: '#97144D',
  burgundyDark: '#710F3A',
  burgundyTint: '#FDE5EE',
  section: '#F1F4F7',
  border: '#E2E2E2',
  heading: '#131A25',
  body: '#282828',
  muted: '#5F6672',
  green: '#5CAA3C',
};

/*
 * Sizing is rem-based (spacing, controls, text) so the whole UI scales from the root font size.
 * index.html enlarges the root font size when the browser is zoomed out, so 50% / 75% zoom looks like 100%.
 */
const rem = (px: number) => `${px / 16}rem`;

export const theme = createTheme({
  spacing: (factor: number) => `${0.5 * factor}rem`,
  palette: {
    primary: { main: brand.burgundy, dark: brand.burgundyDark, light: '#B8436F', contrastText: '#fff' },
    secondary: { main: brand.heading, contrastText: '#fff' },
    success: { main: '#2E7D32' },
    background: { default: brand.section, paper: '#FFFFFF' },
    text: { primary: brand.heading, secondary: brand.muted },
    divider: brand.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Lato', 'Plus Jakarta Sans', 'Segoe UI', Roboto, Arial, sans-serif",
    h1: { fontSize: 'clamp(1.4rem, 1.1rem + 1vw, 1.85rem)', fontWeight: 900, letterSpacing: '-0.01em' },
    h2: { fontSize: 'clamp(1.2rem, 1rem + 0.6vw, 1.45rem)', fontWeight: 700 },
    h3: { fontSize: '1.125rem', fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { color: brand.body, overflowX: 'hidden' },
        '*:focus-visible': { outline: `3px solid ${alpha(brand.burgundy, 0.45)}`, outlineOffset: 2 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: rem(8), padding: `${rem(6)} ${rem(18)}`, minHeight: rem(40), fontSize: rem(15) },
        sizeSmall: { padding: `${rem(4)} ${rem(10)}`, minHeight: rem(32), fontSize: rem(13) },
        sizeLarge: { padding: `${rem(8)} ${rem(22)}`, minHeight: rem(46), fontSize: rem(16) },
        startIcon: { marginRight: rem(8), '& > *:nth-of-type(1)': { fontSize: rem(20) } },
        endIcon: { '& > *:nth-of-type(1)': { fontSize: rem(20) } },
      },
    },
    MuiIconButton: { styleOverrides: { root: { padding: rem(8) }, sizeSmall: { padding: rem(5) } } },
    MuiSvgIcon: { styleOverrides: { fontSizeSmall: { fontSize: rem(20) } } },
    MuiChip: {
      styleOverrides: {
        root: { height: 'auto', minHeight: rem(32), borderRadius: rem(16), fontSize: rem(13) },
        sizeSmall: { minHeight: rem(24), fontSize: rem(12) },
        label: { padding: `${rem(4)} ${rem(12)}`, '.MuiChip-sizeSmall &': { padding: `${rem(2)} ${rem(8)}` } },
      },
    },
    MuiInputBase: { styleOverrides: { root: { fontSize: rem(16) } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', borderRadius: rem(10) },
        input: { padding: `${rem(16.5)} ${rem(14)}`, '.MuiInputBase-sizeSmall &': { padding: `${rem(8.5)} ${rem(14)}` } },
        multiline: { padding: `${rem(8.5)} ${rem(14)}` },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          transform: `translate(${rem(14)}, ${rem(16)}) scale(1)`,
          '&.MuiInputLabel-sizeSmall': { transform: `translate(${rem(14)}, ${rem(9)}) scale(1)` },
          '&.MuiInputLabel-shrink': { transform: `translate(${rem(14)}, ${rem(-9)}) scale(0.75)` },
        },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: rem(12), marginInline: rem(14), marginTop: rem(3) } } },
    MuiSelect: { styleOverrides: { icon: { right: rem(7), fontSize: rem(24) } } },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: { '&.MuiInputBase-sizeSmall': { padding: `${rem(6)} ${rem(6)}` } },
        option: { fontSize: rem(15), minHeight: rem(36) },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { fontSize: rem(15), minHeight: rem(36), padding: `${rem(6)} ${rem(16)}` } } },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: rem(36) } } },
    MuiListItemAvatar: { styleOverrides: { root: { minWidth: rem(56) } } },
    MuiAvatar: { styleOverrides: { root: { width: rem(40), height: rem(40), fontSize: rem(18) } } },
    MuiBadge: { styleOverrides: { badge: { fontSize: rem(12), height: rem(20), minWidth: rem(20), padding: `0 ${rem(6)}`, borderRadius: rem(10) } } },
    MuiDialog: { styleOverrides: { paperWidthXs: { maxWidth: rem(444) }, paper: { margin: rem(32) } } },
    MuiDialogTitle: { styleOverrides: { root: { padding: `${rem(16)} ${rem(24)}` } } },
    MuiDialogContent: { styleOverrides: { root: { padding: `${rem(20)} ${rem(24)}` } } },
    MuiDialogActions: { styleOverrides: { root: { padding: rem(8) } } },
    MuiToolbar: { styleOverrides: { root: { minHeight: rem(64) } } },
    MuiTabs: { styleOverrides: { root: { minHeight: rem(48) }, indicator: { height: rem(2) } } },
    MuiToggleButton: { styleOverrides: { root: { padding: rem(8), fontSize: rem(14) }, sizeSmall: { padding: rem(6), fontSize: rem(13) } } },
    MuiCircularProgress: { defaultProps: { size: rem(40) } },
    MuiTableSortLabel: { styleOverrides: { icon: { fontSize: rem(18) } } },
    MuiLinearProgress: { styleOverrides: { root: { height: rem(4) } } },
    MuiSnackbar: { styleOverrides: { root: { fontSize: rem(14) } } },
    MuiAlert: { styleOverrides: { root: { fontSize: rem(14), padding: `${rem(6)} ${rem(16)}` }, icon: { fontSize: rem(22), padding: `${rem(7)} 0`, marginRight: rem(12) }, message: { padding: `${rem(8)} 0` } } },
    MuiTablePagination: { styleOverrides: { toolbar: { minHeight: rem(52) } } },
    MuiPaginationItem: { styleOverrides: { root: { minWidth: rem(34), height: rem(34), fontSize: rem(14), borderRadius: rem(8), margin: `0 ${rem(3)}` } } },
    MuiCardActionArea: { styleOverrides: { focusHighlight: {} } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: brand.border } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: brand.heading, backgroundColor: brand.section, whiteSpace: 'nowrap' },
        root: { borderColor: brand.border, padding: rem(16), fontSize: rem(14) },
        sizeSmall: { padding: `${rem(6)} ${rem(16)}` },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', minHeight: rem(48), padding: `${rem(12)} ${rem(16)}`, minWidth: rem(90), maxWidth: 'none', whiteSpace: 'nowrap' } } },
    MuiTooltip: { defaultProps: { arrow: true }, styleOverrides: { tooltip: { fontSize: rem(12), padding: `${rem(4)} ${rem(8)}` } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
  },
});
