# 聲波飛行

## 開啟網頁

在本資料夾執行 `python -m http.server 8000 --bind 127.0.0.1 --directory dist`，
再用電腦版 Chrome 開啟 http://localhost:8000/。
沒有硬體時，可按「試玩」並拖動遊戲畫面或使用距離滑桿。

## 接線與上傳

開發板採用 Realtek Ameba AMB82-MINI。接線依照目前的 `hand_sensor.ino`。

| 超音波模組 | AMB82-MINI |
| --- | --- |
| VCC | 3.3 V |
| GND | GND |
| TRIG | Arduino 腳位 2 |
| ECHO | Arduino 腳位 1|


用 Arduino IDE 開啟 [hand_sensor.ino](dist/hand_sensor/hand_sensor.ino)，在 AmebaPro2 板卡選單選擇與實體板相符的 AMB82-MINI 版本，再上傳。[Realtek 板卡設定與腳位表](https://ameba-doc-arduino-sdk.readthedocs-hosted.com/en/latest/ameba_pro2/amb82-mini/Getting_Started/Getting%20Started%20with%20Ameba.html)
關閉序列監控視窗後，在遊戲按「連接感測器」，選 AMB82-MINI 的連接埠。
若使用自有韌體，瀏覽器以 115200 baud 讀取每行一個以公分為單位的數字。

手掌靠近感測器時飛船上升，遠離時下降，操控範圍是 8–38 公分。
手掌停在 18–28 公分約一秒可起飛或重新開始。每穿過一個閘門得一分。
飛行中失去讀數時會暫停，讀數恢復就繼續。最高分存在目前的瀏覽器。