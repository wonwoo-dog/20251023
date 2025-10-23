// =================================================================
// 步驟一：模擬成績數據接收與全域變數設定
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 煙火相關的全域變數
let fireworks = []; // 儲存煙火物件的陣列
let gravity; // 重力向量
let isPlayingFireworks = false; // 追蹤是否正在播放煙火動畫

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        let percentage = (finalScore / maxScore) * 100;

        // 判斷是否進入煙火模式 (90% 以上)
        if (percentage >= 90) {
            if (!isPlayingFireworks) {
                loop(); // 開始持續呼叫 draw()
                isPlayingFireworks = true;
                // 為了讓特效更明顯，可以在剛達到高分時立即發射一顆煙火
                fireworks.push(new Firework()); 
            }
        } else {
            // 分數低於 90%
            if (isPlayingFireworks) {
                // 如果是從高分狀態切換到低分，停止發射新的煙火並清除現有的
                isPlayingFireworks = false; 
                fireworks = []; 
            }
            // 如果 draw() 正在執行，它會在下一幀反映分數變化。
            if (isLooping()) {
                // 如果希望低分時停止動畫以節省資源，可以呼叫 noLoop()，
                // 但為了確保分數文字能即時更新，可以保留 loop()。
            } else {
                // 如果目前是 noLoop() 狀態，必須呼叫 redraw() 來更新分數文字
                redraw();
            }
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js setup() 與 draw()
// -----------------------------------------------------------------

function setup() { 
    // 創建 Canvas 畫布
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 設定重力向量 (向下)
    gravity = createVector(0, 0.2); 
    
    // 初始進入 noLoop 模式，等待分數接收
    noLoop(); 
} 

function draw() { 
    // 使用帶有透明度的黑色背景，創造粒子拖影效果 (50 是透明度)
    background(0, 0, 0, 50); 
    
    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本
        fill(0, 255, 0); // 鮮綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // -----------------------------------------------------------------
        // C. 播放煙火特效 (核心邏輯)
        // -----------------------------------------------------------------
        if (isPlayingFireworks) {
            // 以低概率 (1.5%) 隨機發射新的煙火
            if (random(1) < 0.015) { 
                fireworks.push(new Firework());
            }

            // 更新並顯示所有煙火
            for (let i = fireworks.length - 1; i >= 0; i--) {
                fireworks[i].update();
                fireworks[i].show();
                
                // 移除已完成的煙火
                if (fireworks[i].done()) {
                    fireworks.splice(i, 1);
                }
            }
        }
        
    } else if (percentage >= 60) {
        // 中等分數
        fill(255, 181, 35); // 黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分
        fill(200, 0, 0); // 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數
        background(255); // 尚未收到分數時，背景為白色
        fill(150);
        text("等待 H5P 成績中...", width / 2, height / 2);
    }

    // 顯示具體分數 (在煙火背景之上)
    textSize(50);
    // 高分模式下分數為白色以在黑色背景上突出，低分模式為深灰色
    fill(percentage >= 90 ? 255 : 50); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
}


// =================================================================
// 步驟三：新增 Firework 相關類別
// -----------------------------------------------------------------

// 粒子 (Particle) 類別，用於煙火爆炸後的小碎片或發射中的火箭
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y); 
        this.firework = firework; // true: 火箭, false: 碎片
        this.lifespan = 255; // 粒子壽命
        this.hu = hu; // 色相 (Hue)
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(0, random(-12, -8)); 
        } else {
            // 碎片向隨機方向發射
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(0.5, 7));
        }
        this.acc = createVector(0, 0); 
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9); // 碎片逐漸減速
            this.lifespan -= 4; // 碎片逐漸消失
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重置加速度
    }
    
    // 檢查粒子是否已消失
    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB); // 使用 HSB 顏色模式
        if (!this.firework) {
            strokeWeight(2);
            // 碎片顏色帶有透明度，實現淡出效果
            stroke(this.hu, 255, 255, this.lifespan); 
        } else {
            strokeWeight(4);
            stroke(this.hu, 255, 255); // 火箭顏色
        }
        point(this.pos.x, this.pos.y);
    }
}

// 煙火 (Firework) 類別
class Firework {
    constructor() {
        this.hu = random(255); // 隨機色相
        // 初始粒子 (火箭)，從底部隨機位置發射
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false; 
        this.particles = []; 
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 當火箭速度朝下 (達到最高點) 時，發生爆炸
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        // 更新爆炸後的碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1); // 移除已消失的碎片
            }
        }
    }

    // 產生爆炸碎片
    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); // 顯示火箭
        }
        
        // 顯示碎片
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    // 檢查煙火是否已完成
    done() {
        return this.exploded && this.particles.length === 0;
    }
}
