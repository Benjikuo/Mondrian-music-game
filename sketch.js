let song;
let fft;

// cooldown 控制
let lastTriggerTime = 0;
let cooldown = 0.2; // seconds

// Mondrian 隱形骨架
let verticalLines = [];
let horizontalLines = [];

let amp;
let trebleAvg = 0;
let prevTreble = 0;
let triggered = false;

// 節點事件資料
let nodes = [];

function preload() {
  song = loadSound("assets/music/music.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT();

  // 初始化幾條結構線（不是等距）
  verticalLines = [
    width * 0.25,
    width * 0.5,
    width * 0.75
  ];

  horizontalLines = [
    height * 0.3,
    height * 0.6
  ];

  background(245);
  amp = new p5.Amplitude();
}

function draw() {
  background(245);

  if (song.isPlaying()) {
    fft.analyze();

    // ===== 1. FFT 能量 =====
    let bass = fft.getEnergy("bass");     // 0–255
    let mid = fft.getEnergy("mid");
    let treble = fft.getEnergy("treble");

    // ===== 2. Amplitude =====
    let level = amp.getLevel();           // 0.0–1.0

    // ===== 3. 相對門檻 =====
    trebleAvg = lerp(trebleAvg, treble, 0.05);
    let threshold = trebleAvg * 1.3;

    // ===== 4. 變化率 =====
    let delta = treble - prevTreble;
    prevTreble = treble;

    // ===== 5. 是否觸發 =====
    triggered = treble > threshold && delta > 5;

    // =============================
    // 🎨 視覺化開始
    // =============================

    noStroke();
    textSize(12);
    fill(0);

    // ---- FFT 能量條 ----
    fill(50);
    text("FFT Energy", 50, height - 150);

    fill(0);
    rect(50, height - 130, bass, 12);
    rect(50, height - 110, mid, 12);
    rect(50, height - 90, treble, 12);

    fill(0);
    text("bass", 10, height - 120);
    text("mid", 10, height - 100);
    text("treble", 10, height - 80);

    // ---- Amplitude ----
    fill(50);
    text("Amplitude", 50, height - 180);

    fill(100);
    rect(50, height - 200, level * 300, 10);
    text(level.toFixed(3), 360, height - 192);

    // ---- Relative Threshold ----
    stroke(255, 0, 0);
    line(50 + threshold, height - 90, 50 + threshold, height - 78);
    noStroke();
    fill(255, 0, 0);
    text("threshold", 50 + threshold + 5, height - 82);

    // ---- Delta ----
    fill(0);
    text("Δ treble: " + delta.toFixed(1), 50, height - 50);

    // ---- Trigger Status ----
    fill(triggered ? "red" : "black");
    text("TRIGGER: " + (triggered ? "ON" : "OFF"), 50, height - 30);

    // ---- FFT Spectrum ----
    let spectrum = fft.analyze();
    stroke(0);
    noFill();
    beginShape();
    for (let i = 0; i < spectrum.length; i++) {
      let x = map(i, 0, spectrum.length, 400, width - 20);
      let y = map(spectrum[i], 0, 255, height - 20, height - 150);
      vertex(x, y);
    }
    endShape();

    noStroke();
    fill(0);
    text("FFT Spectrum", 400, height - 160);
  }

  fill(0);
  text("Click to play music", 20, 30);
}


// ==========================
// 核心系統邏輯
// ==========================

function analyzeHighFrequency() {
  let spectrum = fft.analyze();
  let trebleEnergy = fft.getEnergy("treble"); // 0–255
  let now = song.currentTime();

  // 門檻（你之後可以調）
  if (trebleEnergy > 200 && now - lastTriggerTime > cooldown) {
    generateNode(trebleEnergy, now);
    lastTriggerTime = now;
  }
}

function generateNode(energy, time) {
  // Step 1：隨機位置
  let x = random(width);
  let y = random(height);

  // Step 2：吸附到線條
  x = snapToLines(x, verticalLines, 30);
  y = snapToLines(y, horizontalLines, 30);

  // Step 3：建立節點事件
  let node = {
    time: time,
    x: x,
    y: y,
    energy: energy,
    size: map(energy, 200, 255, 10, 40),
    color: random(["red", "blue", "yellow"])
  };

  nodes.push(node);

  // Step 4：節奏長出結構（每 5 個點加一條線）
  if (nodes.length % 5 === 0) {
    verticalLines.push(x);
  }

  console.log("Node generated:", node);
}

// ==========================
// 工具函式
// ==========================

function snapToLines(value, lines, threshold) {
  let closest = value;
  let minDist = threshold;

  for (let l of lines) {
    let d = abs(value - l);
    if (d < minDist) {
      minDist = d;
      closest = l;
    }
  }
  return closest;
}

// ==========================
// Debug 視覺（暫時）
// ==========================

function drawDebug() {
  // 畫線（只是為了看結構）
  stroke(0);
  strokeWeight(2);

  for (let x of verticalLines) {
    line(x, 0, x, height);
  }
  for (let y of horizontalLines) {
    line(0, y, width, y);
  }

  // 畫節點（未來會換成真正 Mondrian UI）
  noStroke();
  for (let n of nodes) {
    fill(n.color);
    rect(n.x, n.y, n.size, n.size);
  }

  fill(0);
  textSize(14);
  text("Click to play music", 20, 30);
}

// ==========================
// 使用者互動（必須）
// ==========================

function mousePressed() {
  if (!song.isPlaying()) {
    song.play();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
