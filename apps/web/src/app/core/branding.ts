/**
 * Product and vendor identity (UI, document title, printed slips).
 * Update here once — reflected across the web app.
 */
export const APP_BRANDING = {
  productName: 'Malgray Hospital Information System',
  /** Short label for tight layouts (e.g. menubar on small screens). */
  productShortName: 'Malgray HIS',
  companyName: 'Malgray',
  companyWebsite: 'https://malgray.com',
  companyWebsiteDisplay: 'malgray.com',
  /** Clinic contact on printed slips (Life Care header/footer). */
  clinicPhoneDisplay: '0334-9062009',
  clinicPhoneTel: '+923349062009',
  /** Vendor / HIS support (shell, login). */
  supportPhoneDisplay: '0310-5071527',
  supportPhoneTel: '+923105071527',
  designedByLine: 'Software designed by Malgray Labs',
} as const;
