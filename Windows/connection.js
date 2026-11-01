'use strict';
document.getElementById('retry').addEventListener('click', async () => {
  const button = document.getElementById('retry');
  button.disabled = true;
  document.getElementById('status').textContent = 'Bağlanıyor…';
  try { await window.procatsDesktop.retryConnection(); }
  catch { document.getElementById('status').textContent = 'Bağlantı kurulamadı. Tekrar deneyebilirsin.'; button.disabled = false; }
});
