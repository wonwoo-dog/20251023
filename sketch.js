// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 新增煙火相關的全域變數
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
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            // redraw() 僅在 noLoop() 模式下有效，在我們移除 noLoop() 後，
            // 只需要確保在分數更新時，isLooping() 是真的（即 loop() 狀態）
            // 如果 draw() 正在執行，它會在下一幀反映分數變化。
            // 我們主要通過 isPlayingFireworks 狀態來控制邏輯。
            
            // 判斷是否進入煙火模式
            let percentage = (finalScore / maxScore) * 100;
            if (percentage >= 90) {
                if (!isPlayingFireworks) {
                    loop(); // 開始持續呼叫 draw()
                    isPlayingFireworks = true;
                }
            } else {
                if (isPlayingFireworks) {
                    // 如果分數下降，可以選擇停止動畫
                    // noLoop(); // 考慮是否要停止或讓 draw() 繼續執行
                    isPlayingFireworks = false; // 停止發射新的煙火
                    fireworks = []; // 清除現有的煙火
                }
            }
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------
