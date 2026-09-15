// Where the website forms go. Both values come from John's Google account.
// Leave both empty and the forms keep posting to their plain HTML action.
// Fill both in and the forms post to John's Google Apps Script instead
// (inside his HIPAA-covered Google Workspace) with a reCAPTCHA check.
window.WAYPOINT_FORMS = {
  endpoint: "",          // Apps Script web app URL, ends in /exec
  recaptchaSiteKey: ""   // reCAPTCHA v2 "I'm not a robot" site key (the public one)
};
