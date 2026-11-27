"use strict";
const element = id => document.getElementById(id);
const canvas = element("game"), ctx = canvas.getContext("2d");
const {width, height} = canvas;
const shipX = 184, radius = 17, gateWidth = 72;
const near = 8, far = 38, margin = 28;
const sky = ctx.createLinearGradient(0, 0, 0, height);
sky.addColorStop(0, "#101835"); sky.addColorStop(1, "#29335b");
const stars = Array.from({length: 92}, (_, i) => ({
  x: (i * 137.51) % width, y: (i * i * 43.37) % height, r: 1 + i % 3 * .5
}));
let state = "idle", mode = "none", score = 0, best = 0;
let shipY = height / 2, distance = 23, measured = 23, lastSample = -Infinity;
let gates = [], hold = 0, port, reader, busy = false;
try { best = Number(localStorage.getItem("sound-flight-best")) || 0; } catch {}
element("best").textContent = best;
function message(text) { element("status").textContent = text; }
function show(title, hint) {
  element("overlay").hidden = !title;
  element("title").textContent = title;
  element("hint").textContent = hint;
}
function ready() {
  state = "ready"; hold = 0;
  show("準備起飛", "手掌停在 18–28 公分約一秒。");
}
function start() {
  state = "play"; score = 0; hold = 0; gates = [];
  element("score").textContent = score;
  show("", "");
}
function crash() {
  state = "over"; hold = 0;
  show("飛行結束", mode === "sensor" ? "手掌回到 18–28 公分並停留一秒，再飛一次。" : "按「再玩一次」重新起飛。");
  if (mode === "demo") element("demo").textContent = "再玩一次";
}
function sample(line) {
  if (!/^\d+(?:\.\d+)?$/.test(line)) return;
  const value = Number(line);
  if (value < 2 || value > 400) return;
  const now = performance.now();
  measured = now - lastSample > 750 ? value : measured * .55 + value * .45;
  lastSample = now;
}
async function connect() {
  if (!("serial" in navigator)) {
    message("這個瀏覽器無法使用 Web Serial。請用電腦版 Chrome，在 HTTPS 或 localhost 開啟遊戲。");
    return;
  }
  busy = true;
  element("connect").disabled = true;
  let opened = false;
  try {
    const selected = await navigator.serial.requestPort();
    await selected.open({baudRate: 115200});
    port = selected; opened = true;
    mode = "sensor"; lastSample = -Infinity;
    element("sliderLabel").hidden = true;
    element("demo").textContent = "試玩";
    element("connect").textContent = "中斷連線";
    element("connect").disabled = false;
    ready();
    const decoder = new TextDecoder();
    let pending = "";
    reader = port.readable.getReader();
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      const lines = (pending + decoder.decode(value, {stream:true})).split("\n");
      pending = lines.pop();
      if (pending.length > 64) pending = "";
      for (const line of lines) sample(line.trim());
    }
  } catch (error) {
    if (!opened) message(error.name === "NotFoundError" ? "尚未選擇連接埠。" : "無法開啟連接埠，請確認 Arduino 已接上並關閉序列監控視窗。");
  } finally {
    if (opened) {
      reader?.releaseLock(); reader = undefined;
      try { await port.close(); } catch {}
      port = undefined;
      mode = "none"; state = "idle"; gates = [];
      element("distance").textContent = "—";
      element("connect").textContent = "連接感測器";
      show("連接感測器開始", "也可以先試玩。");
      message("感測器已中斷連線。");
    }
    busy = false;
    element("connect").disabled = false;
  }
}
element("connect").onclick = () => {
  if (reader) {
    element("connect").disabled = true;
    reader.cancel().catch(() => {});
  } else if (!busy) connect();
};
element("demo").onclick = () => {
  if (port) { message("請先中斷感測器連線，再切換到試玩。"); return; }
  mode = "demo"; distance = Number(element("slider").value);
  element("sliderLabel").hidden = false;
  element("demo").textContent = "重新開始";
  message("拖動遊戲畫面上下移動，或使用模擬距離滑桿。");
  start();
};
function pointer(event) {
  if (mode !== "demo") return;
  const box = canvas.getBoundingClientRect();
  const fraction = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
  element("slider").value = Math.round(near + fraction * (far - near));
}
canvas.addEventListener("pointerdown", event => {
  if (mode === "demo") { canvas.setPointerCapture(event.pointerId); pointer(event); }
});
canvas.addEventListener("pointermove", event => {
  if (canvas.hasPointerCapture(event.pointerId)) pointer(event);
});
let previous = performance.now(), drift = 0;
function frame(now) {
  const dt = Math.min(.033, Math.max(0, (now - previous) / 1000));
  previous = now;
  const fresh = now - lastSample < 750;
  if (mode === "sensor") {
    if (fresh) distance = measured;
    if (!fresh && state === "play") {
      state = "paused"; hold = 0;
      show("已暫停", "把手掌移回感測器前，飛行會自動繼續。");
    } else if (fresh && state === "paused") {
      state = "play"; show("", "");
    }
    message(fresh ? "感測器已連線 · 靠近上升，遠離下降" : "等待有效距離讀數，請將手掌放在感測器前方。");
    if (state === "ready" || state === "over") {
      hold = fresh && distance >= 18 && distance <= 28 ? hold + dt : 0;
      if (hold >= 1) start();
    }
  } else if (mode === "demo") {
    distance = Number(element("slider").value);
  }
  if (mode === "sensor" || mode === "demo") {
    element("distance").textContent = mode === "sensor" && !fresh ? "—" : Math.round(distance) + " cm";
  }
  if (state !== "paused" && state !== "over") {
    const t = Math.max(0, Math.min(1, (distance - near) / (far - near)));
    shipY += (margin + t * (height - 2 * margin) - shipY) * (1 - Math.exp(-13 * dt));
  }
  if (state === "play") {
    const speed = score >= 5 ? 275 : 215;
    const gap = score >= 5 ? 175 : 225;
    if (!gates.length || gates.at(-1).x < width - 345) {
      const top = 55 + Math.random() * (height - gap - 110);
      gates.push({x: width, top, bottom: top + gap, passed:false});
    }
    drift += speed * dt;
    for (const gate of gates) {
      gate.x -= speed * dt;
      if (shipX + radius > gate.x && shipX - radius < gate.x + gateWidth &&
          (shipY - radius < gate.top || shipY + radius > gate.bottom)) {
        crash();
        break;
      }
      if (!gate.passed && gate.x + gateWidth < shipX - radius) {
        gate.passed = true;
        element("score").textContent = ++score;
        if (score > best) {
          best = score; element("best").textContent = best;
          try { localStorage.setItem("sound-flight-best", best); } catch {}
        }
      }
    }
    gates = gates.filter(gate => gate.x + gateWidth >= 0);
  }
  draw();
  requestAnimationFrame(frame);
}
function draw() {
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#9fb5e8";
  for (const star of stars) {
    const x = ((star.x - drift * (.08 + star.r * .04)) % width + width) % width;
    ctx.globalAlpha = star.r * .3;
    ctx.fillRect(x, star.y, star.r, star.r);
  }
  ctx.globalAlpha = 1;
  for (const gate of gates) {
    ctx.fillStyle = "#33486c";
    ctx.fillRect(gate.x, 0, gateWidth, gate.top);
    ctx.fillRect(gate.x, gate.bottom, gateWidth, height - gate.bottom);
    ctx.fillStyle = "#7af5d4";
    ctx.fillRect(gate.x, gate.top - 7, gateWidth, 7);
    ctx.fillRect(gate.x, gate.bottom, gateWidth, 7);
    ctx.fillStyle = "#516589";
    ctx.fillRect(gate.x + 9, 0, 7, gate.top - 7);
    ctx.fillRect(gate.x + 9, gate.bottom + 7, 7, height - gate.bottom - 7);
  }
  ctx.save(); ctx.translate(shipX, shipY);
  ctx.fillStyle = "#ffac76"; ctx.beginPath();
  ctx.moveTo(-16, -6); ctx.lineTo(-30 - 4 * Math.sin(drift / 10), 0);
  ctx.lineTo(-16, 6); ctx.fill();
  ctx.fillStyle = "#a0f4df"; ctx.beginPath();
  ctx.moveTo(23, 0); ctx.quadraticCurveTo(7, -15, -19, -11);
  ctx.lineTo(-13, 0); ctx.lineTo(-19, 11);
  ctx.quadraticCurveTo(7, 15, 23, 0); ctx.fill();
  ctx.fillStyle = "#20516a"; ctx.beginPath();
  ctx.ellipse(5, -2, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
show("連接感測器開始", "也可以先試玩。");
message("準備好 Arduino 與超音波感測器後，即可連接。");
requestAnimationFrame(frame);