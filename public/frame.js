// frame.js

// iframe要素を動的に作成
const iframe = document.createElement('iframe');

// Farcaster Mini Appの公開URLを設定
iframe.src = "https://idol-shooter.vercel.app/"; // ここにゲームのURLを指定
iframe.width = "100%";  // iframeの幅を100%に設定（親要素に合わせる）
iframe.height = "600px"; // 高さを600pxに設定（適宜調整）
iframe.frameBorder = "0";  // 枠線を消す
iframe.scrolling = "auto";  // 必要に応じてスクロールバーを表示

// 表示する親要素（FarcasterのMini Appコンテナ）を指定
document.getElementById('mini-app-container').appendChild(iframe);
