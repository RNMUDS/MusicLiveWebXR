# Coldplay Live Concert WebGPU Experience

Three.jsとWebGPUを使用した、没入型の3Dコンサート体験アプリケーションです。仮想スタジアムに50,000人の観客、ダイナミックなライティングシステム、同期されたペンライト、インタラクティブなビジュアルエフェクトを実装しています。

![Concert Experience](https://img.shields.io/badge/Three.js-r0.169.0-blue)
![WebGPU](https://img.shields.io/badge/WebGPU-Enabled-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 特徴

- **大規模観客レンダリング**: 50,000人の観客をインスタンスドメッシュで効率的に描画
- **WebGPU対応**: 最新のWebGPU APIを使用し、非対応ブラウザではWebGLに自動フォールバック
- **リアルタイム音声同期**: Web Audio APIを使用したビート検出と視覚効果の同期
- **動的ライティング**: 複数のスポットライト、ムービングヘッドライト、ストロボ効果
- **ペンライトシステム**: 4種類のカラーパターンで同期するペンライト演出
- **マルチカメラビュー**: 4つのプリセットカメラアングル
- **Webカメラ統合**: スクリーンにWebカメラ映像を表示可能

## 必要な環境

- **Node.js**: v16.0.0以上（推奨: v18以上）
- **npm**: v7.0.0以上
- **モダンブラウザ**:
  - Chrome 113+ (WebGPU対応)
  - Edge 113+ (WebGPU対応)
  - Firefox (WebGL動作)
  - Safari (WebGL動作)

## 環境構築方法

### 1. リポジトリのクローン

```bash
git clone <このリポジトリのURL>
cd <リポジトリ名>
```

### 2. 依存パッケージのインストール

```bash
npm install
```

このコマンドで以下がインストールされます:
- Three.js (r0.169.0)
- Vite (開発サーバー・ビルドツール)

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで自動的に `http://localhost:3000` が開きます。
開かない場合は、ターミナルに表示されたURLにアクセスしてください。

## 使い方

### 基本操作

#### カメラ操作
- **マウスドラッグ**: カメラを回転
- **マウスホイール**: ズームイン/アウト
- **右クリックドラッグ**: カメラをパン（移動）

#### カメラビュー切り替え
画面上部のボタンで4つのプリセットビューに切り替え可能:
- **View 1**: 観客席からステージを見渡すビュー
- **View 2**: ステージ正面のクローズアップビュー
- **View 3**: 上空からの俯瞰ビュー
- **View 4**: ステージサイドからのビュー

#### 照明コントロール
- **Strobe**: ストロボ効果を発動
- **Blackout**: 全ての照明を一時的にオフ

#### ペンライトパターン
- **Wave**: 波状に色が変化
- **Sync**: 全員が同期して色変化
- **Section**: セクションごとに異なる色
- **Random**: ランダムな色パターン

パターンは30秒ごとに自動で切り替わります。

#### スクリーンエフェクト
- **Webcam**: Webカメラ映像を表示（初回はカメラへのアクセス許可が必要）
- **Grayscale**: モノクロ効果
- **Tint**: 色合い調整効果
- **Normal**: 通常表示

### 音声ファイルの追加

デフォルトではデモ用のシンセサイザー音が再生されます。実際の音楽ファイルを使用する場合:

1. 音楽ファイル（MP3, WAV等）を `public/` フォルダに配置
2. [src/main.js](MusicLiveWebXR/src/main.js) の該当箇所を編集:

```javascript
// 初期化時に音声ファイルを読み込む
await this.audioSync.loadAudioFile('/your-music-file.mp3');
```

## プロジェクト構造

```
.
├── index.html              # エントリーポイント
├── MusicLiveWebXR/
│   └── src/
│       ├── main.js         # メインアプリケーションクラス
│       ├── stage.js        # ステージシステム
│       ├── stadium.js      # スタジアム構造
│       ├── audience.js     # 観客アニメーション
│       ├── lights.js       # ライティングシステム
│       ├── penlights.js    # ペンライトシステム
│       ├── screens.js      # スクリーンシステム
│       └── audio.js        # 音声同期システム
├── package.json            # プロジェクト設定
├── vite.config.js          # Vite設定
├── CLAUDE.md               # 開発者向けガイド
└── README.md               # このファイル
```

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
```

`dist/` フォルダに最適化されたファイルが生成されます。

### ビルドのプレビュー

```bash
npm run preview
```

本番ビルドをローカルでテストできます。

### デプロイ

生成された `dist/` フォルダの内容を、以下のサービスにデプロイ可能:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

## パフォーマンスについて

このアプリケーションは50,000個のオブジェクトをリアルタイムでレンダリングするため、ある程度のGPU性能が必要です。

**推奨スペック**:
- GPU: 統合GPU以上（専用GPUを推奨）
- RAM: 8GB以上
- WebGPU対応ブラウザ（Chrome/Edge 113+）

**パフォーマンスが低い場合**:
- ブラウザのハードウェアアクセラレーションを有効化
- 他のタブやアプリケーションを閉じる
- ブラウザを最新バージョンに更新

## 開発ガイド

詳細な開発ガイドは [CLAUDE.md](CLAUDE.md) を参照してください。以下の情報が含まれています:
- アーキテクチャの詳細
- パフォーマンス最適化のベストプラクティス
- 新機能の追加方法
- WebGPU統合の詳細

## トラブルシューティング

### Q: 画面が真っ黒で何も表示されない
A: ブラウザのコンソール（F12）を開いてエラーメッセージを確認してください。WebGPUが利用できない場合は自動的にWebGLにフォールバックします。

### Q: 動作が重い
A: ブラウザのハードウェアアクセラレーションを確認し、WebGPU対応ブラウザ（Chrome/Edge）を使用してください。

### Q: Webカメラが動作しない
A: ブラウザがカメラへのアクセスを許可しているか確認してください。HTTPSまたはlocalhostでのみ動作します。

### Q: 音が出ない
A: ブラウザの自動再生ポリシーにより、ユーザーの操作（クリック等）が必要な場合があります。

## ライセンス

MIT License

## 貢献

バグ報告や機能提案はIssuesでお願いします。プルリクエストも歓迎します。

## クレジット

- Three.js - MIT License
- WebGPU implementation by Three.js team
- Developed for educational purposes
