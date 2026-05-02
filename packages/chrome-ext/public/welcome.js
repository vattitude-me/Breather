document.getElementById('cta-btn').addEventListener('click', async function() {
  try {
    await chrome.action.openPopup();
  } catch {}
  window.close();
});
