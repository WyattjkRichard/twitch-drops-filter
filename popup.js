const blockedList = document.getElementById("blockedList");
const newTitleInput = document.getElementById("newTitle");
const addBtn = document.getElementById("addBtn");

// Load blocked titles from storage
function loadBlockedTitles() {
  blockedTitlesStore.getAll((titles) => {
    blockedList.innerHTML = "";
    titles.forEach(title => {
      const li = document.createElement("li");
      li.textContent = title;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.onclick = () => removeTitle(title);

      li.appendChild(removeBtn);
      blockedList.appendChild(li);
    });
  });
}

// Add a new blocked title
function addTitle() {
  const title = newTitleInput.value.trim();
  if (!title) return;

  blockedTitlesStore.add(title, (titles, added) => {
    if (!added) return;

    newTitleInput.value = "";
    loadBlockedTitles();
    // Send message to content script to trigger filterDrops
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "filterDrops" });
    });
  });
}

// Remove a blocked title
function removeTitle(title) {
  blockedTitlesStore.remove(title, () => {
    loadBlockedTitles();
    // Send message to content script to trigger filterDrops
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "filterDrops" });
    });
  });
}

// Event listener
addBtn.addEventListener("click", addTitle);

// Load on popup open
loadBlockedTitles();

// Refresh blocked list if content script adds a blocked title while popup is open
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'blockedUpdated') {
    loadBlockedTitles();
  }
});