'use strict';
const APP_URL = 'https://procats-example.web.app/';
const APP_ORIGIN = new URL(APP_URL).origin;
const ALLOWED_PERMISSIONS = new Set(['notifications', 'fullscreen', 'clipboard-sanitized-write', 'screen-wake-lock']);
const DOWNLOAD_EXTENSIONS = new Set(['.zip', '.json', '.pdf', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.csv']);
function parseUrl(value) {
  try { return new URL(value); } catch { return null; }
}
function isAppUrl(value) {
  const url = parseUrl(value);
  return !!url && url.origin === APP_ORIGIN && !url.username && !url.password;
}
function isExternalUrl(value) {
  const url = parseUrl(value);
  if (!url || url.username || url.password) return false;
  if (url.protocol === 'https:' || url.protocol === 'http:') return !!url.hostname;
  if (url.protocol !== 'mailto:' || !url.pathname) return false;
  try { return !/[\r\n]/.test(decodeURIComponent(value)); } catch { return false; }
}
function isAppBlob(value) {
  return value.startsWith('blob:') && isAppUrl(value.slice(5));
}
function allowPermission(permission, requestingUrl) {
  return isAppUrl(requestingUrl) && ALLOWED_PERMISSIONS.has(permission);
}
function allowFramePermission(permission, requestingOrigin, details = {}) {
  return details.isMainFrame === true && allowPermission(permission, requestingOrigin) &&
    allowPermission(permission, details.requestingUrl || requestingOrigin);
}
function safeDownloadName(name) {
  // Windows filenames cannot include path separators, device names or alternate streams.
  const clean = String(name).split(/[\\/]/).at(-1).replace(/[<>:"|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 180);
  if (!clean || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(clean)) return null;
  const extension = require('node:path').extname(clean).toLowerCase();
  return DOWNLOAD_EXTENSIONS.has(extension) ? clean : null;
}
module.exports = { APP_URL, APP_ORIGIN, isAppUrl, isExternalUrl, isAppBlob, allowPermission, allowFramePermission, safeDownloadName };
