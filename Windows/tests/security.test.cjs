'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const security = require('../security.cjs');
test('only the exact HTTPS Procats origin is trusted', () => {
  for (const url of ['https://procats-example.web.app/', 'https://procats-example.web.app/privacy.html']) assert.equal(security.isAppUrl(url), true);
  for (const url of ['http://procats-example.web.app/', 'https://procats-example.web.app.evil.example/', 'https://procats-example.web.app@evil.example/', 'https://user:secret@procats-example.web.app/', 'file:///C:/Windows/', 'javascript:alert(1)', 'not a url']) assert.equal(security.isAppUrl(url), false);
});
test('external links cannot launch local files or arbitrary OS protocols', () => {
  for (const url of ['https://www.youtube.com/watch?v=abc', 'https://example.com/', 'mailto:support@example.com']) assert.equal(security.isExternalUrl(url), true);
  for (const url of ['javascript:alert(1)', 'file:///C:/Windows/System32/cmd.exe', 'ms-settings:privacy', 'shell:startup', 'data:text/html,hello', 'https://user:pass@example.com/', 'mailto:test@example.com?subject=%0Aevil', 'mailto:bad%']) assert.equal(security.isExternalUrl(url), false);
});
test('camera, microphone, location and clipboard read stay unavailable', () => {
  for (const permission of ['media', 'geolocation', 'clipboard-read', 'serial', 'usb', 'hid', 'display-capture']) assert.equal(security.allowPermission(permission, security.APP_URL), false);
  for (const permission of ['notifications', 'fullscreen', 'clipboard-sanitized-write', 'screen-wake-lock']) {
    assert.equal(security.allowPermission(permission, security.APP_URL), true);
    assert.equal(security.allowPermission(permission, 'https://other.example/'), false);
  }
});
test('downloads allow Procats backups/reports while denying executable files', () => {
  for (const file of ['Procats-yedek.json', 'Haftalık plan.pdf', 'Procats.zip', 'görevler.png']) assert.equal(security.safeDownloadName(file), file);
  for (const file of ['payload.exe', 'payload.ps1', 'payload.bat', 'payload.lnk', 'report.pdf.exe', 'CON.pdf', 'aux.json', '..', '']) assert.equal(security.safeDownloadName(file), null);
  assert.equal(security.safeDownloadName('../backup.json'), 'backup.json');
  assert.equal(security.safeDownloadName('C:\\Users\\test\\backup.json'), 'backup.json');
});
test('blob downloads must belong to the Procats HTTPS origin', () => {
  assert.equal(security.isAppBlob('blob:https://procats-example.web.app/123'), true);
  assert.equal(security.isAppBlob('blob:https://evil.example/123'), false);
  assert.equal(security.isAppBlob('blob:null/123'), false);
});
test('an embedded frame cannot borrow the permission of its parent page', () => {
  assert.equal(security.allowFramePermission('fullscreen', security.APP_ORIGIN, {isMainFrame: true, requestingUrl: security.APP_URL}), true);
  assert.equal(security.allowFramePermission('fullscreen', 'https://other.example', {isMainFrame: false, embeddingOrigin: security.APP_ORIGIN}), false);
  assert.equal(security.allowFramePermission('fullscreen', security.APP_ORIGIN, {isMainFrame: false, requestingUrl: security.APP_URL}), false);
  assert.equal(security.allowFramePermission('fullscreen', security.APP_ORIGIN, {isMainFrame: true, requestingUrl: 'https://other.example/'}), false);
  assert.equal(security.allowFramePermission('fullscreen', security.APP_ORIGIN, {}), false);
});
