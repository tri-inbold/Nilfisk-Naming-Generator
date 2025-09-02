chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-sidebar',
    title: 'Open in Sidebar',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-sidebar') {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});