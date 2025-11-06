// server.js - WebGPU Concert用HTTPSサーバー with Socket.IO
const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const { Server } = require('socket.io');

const app = express();

const PUBLIC_DIR = path.join(__dirname, 'dist'); // Vite build output
const SRC_DIR = path.join(__dirname, 'src');
const MODULES_DIR = path.join(__dirname, 'node_modules');

// ファイル拡張子ごとに対応する Content-Type（MIMEタイプ）を定義する
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// 静的ファイル配信
app.use(express.static(path.join(__dirname)));

// node_modules を静的配信
app.use('/node_modules', express.static(MODULES_DIR));

// 証明書を読み込む
const options = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'localhost+3-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'localhost+3.pem')),
};

// HTTPSサーバを作成
const server = https.createServer(options, app);

// Socket.IO をサーバに紐づける
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Room別のプレイヤー情報を保持
const rooms = {}; // { roomName: { socketId: {position, rotation, color, name} } }

// データ記録用：Room別のイベントログ（文字起こし、入退室など）
const sessionLogs = {}; // { roomName: { metadata: {...}, events: [...] } }

// データ記録用：Room別のポジションログ（位置・回転データ）
const positionLogs = {}; // { roomName: { metadata: {...}, players: { playerId: [...] } } }

// データ保存用ディレクトリ
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// JST（日本時間 UTC+9）のISO文字列を返すヘルパー関数
function getJSTISOString() {
  const now = new Date();
  const jstOffset = 9 * 60; // JST = UTC+9（分単位）
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().replace('Z', '+09:00');
}

// セッションログの初期化（イベント用）
function initSessionLog(room) {
  sessionLogs[room] = {
    metadata: {
      roomName: room,
      startTime: getJSTISOString(),
      environment: 'coldplay-concert',
      participants: []
    },
    events: []
  };
}

// ポジションログの初期化
function initPositionLog(room) {
  positionLogs[room] = {
    metadata: {
      roomName: room,
      startTime: getJSTISOString(),
      environment: 'coldplay-concert',
      participants: []
    },
    players: {}
  };
}

// イベントログを追加
function logEvent(room, eventType, data) {
  if (!sessionLogs[room]) {
    initSessionLog(room);
  }

  sessionLogs[room].events.push({
    timestamp: getJSTISOString(),
    eventType: eventType,
    ...data
  });
}

// セッションイベントログをJSONファイルに保存
function saveSessionLog(room) {
  if (!sessionLogs[room]) return;

  const timestamp = getJSTISOString().replace(/[:.]/g, '-');
  const safeRoomName = room.replace(/[\/\\:*?"<>|]/g, '_');
  const filename = `session_${safeRoomName}_${timestamp}_events.json`;
  const filepath = path.join(logsDir, filename);

  sessionLogs[room].metadata.endTime = getJSTISOString();

  fs.writeFileSync(filepath, JSON.stringify(sessionLogs[room], null, 2), 'utf8');
  console.log(`✓ イベントログを保存しました: ${filename}`);

  delete sessionLogs[room];
}

// ポジションデータをJSONファイルに保存
function savePositionLog(room) {
  if (!positionLogs[room]) return;

  const timestamp = getJSTISOString().replace(/[:.]/g, '-');
  const safeRoomName = room.replace(/[\/\\:*?"<>|]/g, '_');
  const filename = `session_${safeRoomName}_${timestamp}_position.json`;
  const filepath = path.join(logsDir, filename);

  positionLogs[room].metadata.endTime = getJSTISOString();

  fs.writeFileSync(filepath, JSON.stringify(positionLogs[room], null, 2), 'utf8');
  console.log(`✓ ポジションログを保存しました: ${filename}`);

  delete positionLogs[room];
}

io.on('connection', (socket) => {
  console.log('🎵 Connected:', socket.id);

  // Room参加処理
  socket.on('joinRoom', (data) => {
    const { room, color, name } = data;

    // Socketをroomに参加させる
    socket.join(room);
    socket.currentRoom = room;
    socket.playerName = name;

    console.log(`🚪 入室: ${name} さんが "${room}" に参加しました (ID: ${socket.id})`);

    // Roomの初期化
    if (!rooms[room]) {
      rooms[room] = {};
    }

    // セッションログの初期化（初回のみ）
    if (!sessionLogs[room]) {
      initSessionLog(room);
    }

    // ポジションログの初期化（初回のみ）
    if (!positionLogs[room]) {
      initPositionLog(room);
    }

    // プレイヤー情報を登録
    rooms[room][socket.id] = {
      id: socket.id,
      position: { x: 0, y: 50, z: 150 },
      rotation: { x: 0, y: 0, z: 0 },
      color: color,
      name: name,
      joinTime: getJSTISOString()
    };

    // 参加者リストに追加（イベントログ）
    sessionLogs[room].metadata.participants.push({
      id: socket.id,
      name: name,
      color: color,
      joinTime: getJSTISOString()
    });

    // 参加者リストに追加（ポジションログ）
    positionLogs[room].metadata.participants.push({
      id: socket.id,
      name: name,
      color: color,
      joinTime: getJSTISOString()
    });

    // ポジションログ用のプレイヤーデータ配列を初期化
    positionLogs[room].players[socket.id] = {
      name: name,
      color: color,
      dataPoints: []
    };

    // 参加イベントをログに記録
    logEvent(room, 'playerJoined', {
      playerId: socket.id,
      playerName: name,
      color: color,
      position: rooms[room][socket.id].position,
      rotation: rooms[room][socket.id].rotation
    });

    // 既存のRoom内プレイヤー情報を送信
    socket.emit('currentPlayers', rooms[room]);

    // Room内の他のプレイヤーに新規参加を通知
    socket.to(room).emit('newPlayer', {
      id: socket.id,
      position: rooms[room][socket.id].position,
      rotation: rooms[room][socket.id].rotation,
      color: color,
      name: name
    });
  });

  // プレイヤーのデータを受信（カメラ位置・回転）
  socket.on('playerData', (data) => {
    const room = socket.currentRoom;

    if (!room || !rooms[room] || !rooms[room][socket.id]) {
      return;
    }

    rooms[room][socket.id].position = data.position;
    rooms[room][socket.id].rotation = data.rotation;

    // ポジションログに直接記録
    if (positionLogs[room] && positionLogs[room].players[socket.id]) {
      positionLogs[room].players[socket.id].dataPoints.push({
        timestamp: data.timestamp || getJSTISOString(),
        position: data.position,
        rotation: data.rotation
      });
    }

    // 同じRoom内のプレイヤーにのみ配信
    socket.to(room).emit('playerMoved', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation
    });
  });

  // WebRTC シグナリング: offer の中継
  socket.on('webrtc-offer', (data) => {
    const { targetId, offer } = data;
    console.log(`🎤 WebRTC Offer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit('webrtc-offer', {
      from: socket.id,
      offer: offer
    });
  });

  // WebRTC シグナリング: answer の中継
  socket.on('webrtc-answer', (data) => {
    const { targetId, answer } = data;
    console.log(`🎤 WebRTC Answer: ${socket.id} → ${targetId}`);
    io.to(targetId).emit('webrtc-answer', {
      from: socket.id,
      answer: answer
    });
  });

  // WebRTC シグナリング: ICE candidate の中継
  socket.on('webrtc-ice-candidate', (data) => {
    const { targetId, candidate } = data;
    io.to(targetId).emit('webrtc-ice-candidate', {
      from: socket.id,
      candidate: candidate
    });
  });

  // 音声開始イベント
  socket.on('voiceStart', () => {
    const room = socket.currentRoom;
    if (room) {
      console.log(`🔊 音声開始: ${socket.playerName} (Room: ${room})`);
      logEvent(room, 'voiceStart', {
        playerId: socket.id,
        playerName: socket.playerName
      });
      socket.to(room).emit('playerVoiceStart', { id: socket.id });
    }
  });

  // 音声終了イベント
  socket.on('voiceEnd', (data) => {
    const room = socket.currentRoom;
    if (room) {
      console.log(`🔇 音声終了: ${socket.playerName} (Room: ${room}, 継続時間: ${data.duration}ms)`);
      logEvent(room, 'voiceEnd', {
        playerId: socket.id,
        playerName: socket.playerName,
        duration: data.duration
      });
      socket.to(room).emit('playerVoiceEnd', { id: socket.id });
    }
  });

  // 切断処理
  socket.on('disconnect', () => {
    console.log(`👋 退室: ${socket.playerName || '名前未設定'} (ID: ${socket.id})`);

    const room = socket.currentRoom;

    if (room && rooms[room]) {
      // ポジションデータの記録確認
      if (positionLogs[room] && positionLogs[room].players[socket.id]) {
        const dataCount = positionLogs[room].players[socket.id].dataPoints.length;
        console.log(`📊 ポジションデータ: ${socket.playerName} の ${dataCount} 件のデータポイント`);
      }

      // 退出イベントをログに記録
      logEvent(room, 'playerLeft', {
        playerId: socket.id,
        playerName: socket.playerName,
        position: rooms[room][socket.id]?.position,
        rotation: rooms[room][socket.id]?.rotation
      });

      delete rooms[room][socket.id];

      // Roomが空になったら両方のログを保存して削除
      if (Object.keys(rooms[room]).length === 0) {
        saveSessionLog(room);
        savePositionLog(room);
        delete rooms[room];
      }

      // 同じRoom内のプレイヤーに切断を通知
      socket.to(room).emit('playerDisconnected', socket.id);
    }
  });
});

// サーバを起動
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🎵 Live Concert WebGPU Server');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ HTTPS Server running at:`);
  console.log(`   🔒 https://localhost:${PORT}/`);
  console.log(`   🌐 https://192.168.10.146:${PORT}/`);
  console.log('');
  console.log('Features:');
  console.log('  • WebGPU Renderer (auto-fallback to WebGL)');
  console.log('  • InstancedMesh (97% draw call reduction)');
  console.log('  • Multi-room support with Socket.IO');
  console.log('  • Real-time position & event logging');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});
