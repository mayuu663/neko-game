import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  return (
    <div>
      {/* ここは Head 1 ペアだけ */}
      <Head>
        <title>Neko Game</title>

        {/* Frame 用メタタグ */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://あなたのドメイン/preview.png" />
        <meta property="fc:frame:button:1" content="Play Now" />
        <meta property="fc:frame:post_url" content="https://あなたのドメイン/api/entry" />
      </Head>

      {/* Start Screen */}
      <div
        id="startScreen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#111',
          color: '#fff',
          textAlign: 'center',
          backgroundImage: 'url(/preview.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 style={{ fontSize: '2.5rem' }}>🐱 Neko Game</h1>
        <button
          id="startButton"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.95rem',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#ff66cc',
            color: '#fff',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          Start Game
        </button>
      </div>

      {/* Game UI */}
      <div id="gameUI" style={{ display: 'none', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas
            id="gameCanvas"
            width="360"
            height="640"
            style={{ border: '2px solid #fff', background: '#000' }}
          ></canvas>

          {/* Timer */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            Time: <span id="timerDisplay">30s</span>
          </div>

          {/* Score */}
          <div
            id="scoreDisplay"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            Score: <span id="scoreValue">0</span>
          </div>

          {/* Health Bar */}
          <div
            id="playerHealthBar"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '100px',
              height: '10px',
              backgroundColor: '#ccc',
              borderRadius: '5px',
            }}
          >
            <div
              id="playerHealth"
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: 'green',
                borderRadius: '5px',
              }}
            ></div>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <button id="leftBtn" style={buttonStyle}>⬅️</button>
          <button id="shootBtn" style={buttonStyle}>💘</button>
          <button id="rightBtn" style={buttonStyle}>➡️</button>
        </div>
      </div>

      {/* Result Screen */}
      <div
        id="result"
        style={{
          display: 'none',
          textAlign: 'center',
          padding: '30px',
          fontSize: '20px',
          color: '#fff',
        }}
      ></div>

      {/* Game Logic Script */}
      <Script src="/game.js" strategy="afterInteractive" />
    </div>
  );
}

/* 共通ボタンスタイル */
const buttonStyle = {
  padding: '0.5rem 0.8rem',
  fontSize: '1.2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: '#fff',
  color: '#000',
  border: '2px solid #ccc',
};
