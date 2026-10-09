// Apply appearance before the application and styles load to reduce theme flash.
;(() => {
  let preference = 'system'
  try {
    const stored = localStorage.getItem('insightsphere.theme')
    if (stored === 'light' || stored === 'dark') preference = stored
  } catch {
    // Browser storage can be unavailable; device appearance remains usable.
  }
  const theme =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#101c2b' : '#f3f6fa')
})()
