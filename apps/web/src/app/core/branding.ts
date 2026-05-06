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
  /** Pakistan mobile; tel: uses E.164 without spaces. */
  supportPhoneDisplay: '0310-5071527',
  supportPhoneTel: '+923105071527',
  designedByLine: 'Software designed by Malgray Labs',
} as const;
