// background.js

chrome.runtime.onInstalled.addListener(() => {
  // Menu mở sidebar
  chrome.contextMenus.create({
    id: 'open-sidebar',
    title: 'Open in Sidebar',
    contexts: ['action']
  });

  // Menu hiển thị phím tắt
  chrome.contextMenus.create({
    id: 'show-shortcuts',
    title: 'Phím tắt',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-sidebar' && tab) {
    chrome.sidePanel.open({ tabId: tab.id });
  }

  if (info.menuItemId === 'show-shortcuts') {
    const shortcutsMessage = '▶ Enter: Tạo tên\n' +
                           '▶ Ctrl + Backspace: Xóa toàn bộ form';

    chrome.notifications.create({
      type: 'basic',
      // SỬA LỖI: Trỏ đến đúng tên tệp icon.png
      iconUrl: 'icon.png',
      title: 'Phím tắt - Naming Generator',
      message: shortcutsMessage
    });
  }
});