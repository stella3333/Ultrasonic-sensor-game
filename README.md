# 聲波飛行

## 開啟網頁

在本資料夾執行 `python -m http.server 8000 --bind 127.0.0.1 --directory dist`，
再用電腦版 Chrome 開啟 http://localhost:8000/。
沒有硬體時，可按「試玩」並拖動遊戲畫面或使用距離滑桿。

## 接線與上傳

硬體採用 Arduino Uno R3（5 V）和 HC-SR04。VCC → 5V、GND → GND、
TRIG → D9、ECHO → D10。

將 dist/hand_sensor.ino 放進名為 hand_sensor 的資料夾，用 Arduino IDE 上傳。
關閉序列監控視窗後，在遊戲按「連接感測器」，選 Arduino 的連接埠。
若使用自有韌體，瀏覽器以 115200 baud 讀取每行一個以公分為單位的數字。

手掌靠近感測器時飛船上升，遠離時下降，操控範圍是 8–38 公分。
手掌停在 18–28 公分約一秒可起飛或重新開始。每穿過一個閘門得一分。
飛行中失去讀數時會暫停，讀數恢復就繼續。最高分存在目前的瀏覽器。