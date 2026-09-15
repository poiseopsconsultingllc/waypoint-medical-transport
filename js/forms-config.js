// Where the website forms go. Both values come from John's Google account
// and both are required: the booking form and the rate sheet request form
// post to John's Google Apps Script (inside his HIPAA-covered Google
// Workspace) after a reCAPTCHA check. See main.js, wireForm().
window.WAYPOINT_FORMS = {
  endpoint: "https://script.google.com/macros/s/AKfycbzWZZ2uMldRRqYkKmOelIBiurj0kY_YbgdRPBlRG3K5XcsC-P7VToKnEKuhYesH2MQy/exec",
  recaptchaSiteKey: "6LelkL0tAAAAAGlApbwiz1MswfhAwcBZywi17fAJ"
};
