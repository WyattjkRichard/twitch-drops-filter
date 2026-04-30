const BLOCKED_TITLES_KEY = "blockedTitles";

const blockedTitlesStore = {
  getAll(callback) {
    chrome.storage.local.get(BLOCKED_TITLES_KEY, (data) => {
      callback(data[BLOCKED_TITLES_KEY] || []);
    });
  },

  add(title, callback) {
    this.getAll((titles) => {
      if (titles.includes(title)) {
        callback(titles, false);
        return;
      }

      const nextTitles = [...titles, title];
      chrome.storage.local.set({ [BLOCKED_TITLES_KEY]: nextTitles }, () => {
        callback(nextTitles, true);
      });
    });
  },

  remove(title, callback) {
    this.getAll((titles) => {
      const nextTitles = titles.filter((t) => t !== title);
      chrome.storage.local.set({ [BLOCKED_TITLES_KEY]: nextTitles }, () => {
        callback(nextTitles);
      });
    });
  }
};
