// 失语的黄昏 — 游戏入口
// 最小可访问状态：连接 UI 元素，不实现玩法循环
(function () {
  'use strict';

  var statusEl = document.getElementById('status');
  var startBtn = document.querySelector('.start-btn');

  if (startBtn && statusEl) {
    startBtn.addEventListener('click', function () {
      statusEl.textContent = '名字账册正在苏醒……';
      startBtn.disabled = true;
      startBtn.style.opacity = '0.5';
    });
  }
})();
