let video, handpose, predictions = [];
let icons = [];
let selected = [];
let score = 0;
let message = "";
let messageTimer = 0;

// 你可以放自己的圖檔，檔名請對應下方
let imgRabbit, imgCat, imgBear, imgCarrot, imgFish, imgHoney;

// 配對資料（動物對應食物）
const pairs = [
  { animal: "兔子", food: "紅蘿蔔" },
  { animal: "貓", food: "魚" },
  { animal: "熊", food: "蜂蜜" }
];

// 載入圖檔
function preload() {
  imgRabbit = loadImage("圖/640.gif");
  imgCat = loadImage("圖/小八貓-吉伊卡哇 (1).gif");
  imgBear = loadImage("圖/005L0HLIgy1hj0k5hbhtdg304g04gqmf.gif");
  imgCarrot = loadImage("圖/istockphoto-918222612-170667a.jpg");
  imgFish = loadImage("圖/2e83961a1c6ff939ecaf9cdd2aa7b4b5.jpg");
  imgHoney = loadImage("圖/MROXSfqsvm_small.jpg");
}

// 初始化圖示（3動物+3食物，隨機排列）
function setupIcons() {
  icons = [];
  let positions = [
    { x: 120, y: 150 }, { x: 320, y: 150 }, { x: 520, y: 150 },
    { x: 120, y: 330 }, { x: 320, y: 330 }, { x: 520, y: 330 }
  ];
  let items = [
    { type: "animal", label: pairs[0].animal, img: imgRabbit },
    { type: "animal", label: pairs[1].animal, img: imgCat },
    { type: "animal", label: pairs[2].animal, img: imgBear },
    { type: "food", label: pairs[0].food, img: imgCarrot },
    { type: "food", label: pairs[1].food, img: imgFish },
    { type: "food", label: pairs[2].food, img: imgHoney }
  ];
  // 隨機排列
  items = shuffle(items);
  for (let i = 0; i < 6; i++) {
    icons.push({
      ...items[i],
      x: positions[i].x,
      y: positions[i].y,
      r: 50,
      matched: false
    });
  }
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  setupIcons();
}

function modelReady() {
  console.log("Handpose 模型載入完成");
}

let showIntro = true; // 控制簡介顯示

function draw() {
  background(220, 240, 255);
  image(video, 0, 0, width, height);

  // 畫說明
  fill(255); // 白底
  stroke(0); // 黑框
  strokeWeight(2);
  rect(width / 2 - 260, 6, 520, 32, 12); // 白底框
  noStroke();
  fill(0); // 黑字
  textSize(18);
  textAlign(CENTER, TOP);
  text("請用食指指尖依序點選一個動物和一個食物進行配對", width / 2, 10);

  // 畫圖示（用圖片）
  let allMatched = true;
  for (let i = 0; i < icons.length; i++) {
    let icon = icons[i];
    if (!icon.matched) allMatched = false;
    if (icon.matched) continue; // 配對成功就不畫
    // 先畫圖片
    if (icon.img) {
      image(icon.img, icon.x - icon.r, icon.y - icon.r, icon.r * 2, icon.r * 2);
    } else {
      fill(200);
      ellipse(icon.x, icon.y, icon.r * 2, icon.r * 2);
    }
    // 再畫邊框
    if (selected.includes(i)) {
      stroke(255, 120, 0); // 橘色
      strokeWeight(6);
    } else {
      stroke(80);
      strokeWeight(2);
    }
    noFill();
    ellipse(icon.x, icon.y, icon.r * 2, icon.r * 2);
    noStroke();
    fill(255, 100, 200); // 亮粉色
    textSize(20);
    textAlign(CENTER, CENTER);
    text(icon.label, icon.x, icon.y + icon.r + 18);
  }

  // 畫食指指尖
  if (predictions.length > 0) {
    let [x, y] = predictions[0].landmarks[8];
    fill(255, 100, 200);
    noStroke();
    ellipse(x, y, 24, 24);

    // 檢查是否碰到圖示
    for (let i = 0; i < icons.length; i++) {
      let icon = icons[i];
      if (icon.matched) continue; // 已配對成功的不再選
      if (!selected.includes(i) && dist(x, y, icon.x, icon.y) < icon.r) {
        // 避免連續觸發，需鬆開再碰觸
        if (!selected._lastTouch || selected._lastTouch !== i) {
          selected.push(i);
          selected._lastTouch = i;
          setTimeout(() => { selected._lastTouch = null; }, 400);
        }
        break;
      }
    }
  }

  // 配對判斷
  if (selected.length === 2) {
    let a = icons[selected[0]];
    let b = icons[selected[1]];
    let isPair = false;
    if (a.type !== b.type) {
      for (let p of pairs) {
        if (
          (a.type === "animal" && a.label === p.animal && b.label === p.food) ||
          (b.type === "animal" && b.label === p.animal && a.label === p.food)
        ) {
          isPair = true;
          break;
        }
      }
    }
    if (isPair) {
      icons[selected[0]].matched = true;
      icons[selected[1]].matched = true;
      score++;
      message = "配對成功！";
    } else {
      // 選錯全部重製為未選狀態
      message = "再試一次";
      for (let i = 0; i < icons.length; i++) {
        icons[i].matched = false;
      }
    }
    messageTimer = millis();
    selected = [];
  }

  // 顯示分數與訊息
  fill(255, 100, 200); // 亮粉色
  textSize(20);
  textAlign(LEFT, TOP);
  text("得分：" + score, 20, 440);

  if (message && millis() - messageTimer < 1200) {
    fill(message === "配對成功！" ? color(0, 180, 0) : color(200, 0, 0));
    textSize(28);
    textAlign(CENTER, CENTER);
    text(message, width / 2, height / 2);
  }

  // 全部配對完成時顯示教育科技系簡介
  if (allMatched && showIntro) {
    // 框
    fill(255, 240, 220, 240);
    rect(width / 2 - 300, 80, 600, 320, 24);

    // 標題
    fill(0);
    textSize(22);
    textAlign(CENTER, TOP);
    text("教育科技學系簡介", width / 2, 100);

    // 內文
    textSize(16);
    textAlign(LEFT, TOP);
    let intro = 
      "教育科技學系" +
      "專注於「教育科技理論」、「教學設計」、「訓練發展與評鑑」、\n" +
      "「媒體製作」、「專案管理」等方面之理論與實務課程，以提升學生之專業素養。\n\n" +
      "本系教學特色：\n" +
      " (一) 注重資訊傳播科技應用能力之培育\n" +
      " (二) 強調教育訓練專業之基礎培育\n" +
      " (三) 提供學習理論及教學設計的紮實基礎\n" +
      " (四) 重視理論與實務之應用";
    // 讓內文在框內，左右留白30px，上方留白30px
    text(intro, width / 2 - 270, 140, 540, 240);
  }
}

// 滑鼠點擊時讓簡介消失
function mousePressed() {
  showIntro = false;
}

