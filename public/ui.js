(function initializeParticipantUi() {
  function renderIcons(root = document) {
    if (!window.lucide) return;
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
        width: "20",
        height: "20",
        "stroke-width": "2",
      },
      root,
    });
  }

  window.renderParticipantIcons = renderIcons;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderIcons());
  } else {
    renderIcons();
  }
})();
