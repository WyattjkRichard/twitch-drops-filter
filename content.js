// Load blocked titles from storage
let blockedTitles = [];

blockedTitlesStore.getAll((titles) => {
  blockedTitles = titles;
});

// Remove blocked drops
function filterDrops() {
  const root = document.querySelector('.drops-root__content');
  if (!root) return;

  // Restore any campaigns this extension hid previously, then apply current filters.
  unhideAllExtensionHidden(root);

  const paragraphs = root.querySelectorAll('p');

  paragraphs.forEach((p) => {
    const text = p.textContent.trim();

    const match = blockedTitles.find(title =>
      text.toLowerCase().includes(title.toLowerCase())
    );

    if (!match) return;

    const container = getDropContainerFromTitle(p);
    if (!container) return;

    console.log("Hiding:", text);
    hideContainerByExtension(container);
  });

  // Ensure each campaign header has a hide button
  injectHideButtons();
}

// Inject a small "Hide" button into each campaign header
function injectHideButtons() {
  const root = document.querySelector('.drops-root__content');
  if (!root) return;

  const headers = root.querySelectorAll('[class*="accordion-header"]');
  headers.forEach(header => {
    if (header.querySelector('.tdf-hide-btn')) return; // already injected

    const btn = document.createElement('button');
    btn.textContent = 'Hide';
    btn.className = 'tdf-hide-btn';
    btn.style.marginLeft = '8px';
    btn.style.padding = '4px 8px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = header.querySelector('p');
      const title = p ? p.textContent.trim() : null;
      const container = header.parentElement;
      if (title) {
        blockedTitlesStore.add(title, (titles) => {
          if (container) hideContainerByExtension(container);
          blockedTitles = titles;
          // notify other parts (popup) to refresh if open
          try { chrome.runtime.sendMessage({ action: 'blockedUpdated' }); } catch (e) {}
        });
      } else {
        if (container) hideContainerByExtension(container);
      }
    });

    header.appendChild(btn);
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "filterDrops") {
    blockedTitlesStore.getAll((titles) => {
      blockedTitles = titles;
      filterDrops(); // run after loading
    });
    sendResponse({ status: "done" });
  }
});

// Twitch loads content dynamically → watch for changes
const observer = new MutationObserver(() => {
  filterDrops();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function getDropContainerFromTitle(titleElement) {
  const header = titleElement.closest('[class*="accordion-header"]');
  if (!header) return null;

  // This is the actual full drop container
  return header.parentElement;
}

function hideContainerByExtension(container) {
  container.style.display = 'none';
  container.dataset.tdfHidden = 'true';
}

function unhideAllExtensionHidden(root) {
  const hidden = root.querySelectorAll('[data-tdf-hidden="true"]');
  hidden.forEach((container) => {
    container.style.removeProperty('display');
    delete container.dataset.tdfHidden;
  });
}