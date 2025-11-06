import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Stadium } from './stadium.js';
import { Stage } from './stage.js';
import { Audience } from './audience.js';
import { LightingSystem } from './lights.js';
import { PenlightSystem } from './penlights.js';
import { ScreenSystem } from './screens.js';
import { AudioSync } from './audio.js';

class ColdplayConcert {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.stadium = null;
        this.stage = null;
        this.audience = null;
        this.lightingSystem = null;
        this.penlightSystem = null;
        this.screenSystem = null;
        this.audioSync = null;

        this.clock = new THREE.Clock();
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();

        this.init();
    }

    async init() {
        // WebGPU対応チェック
        if (!navigator.gpu) {
            console.warn('❌ WebGPU is not supported on this browser');
            console.warn('ブラウザ:', navigator.userAgent);
            console.warn('対応ブラウザ: Chrome 113+, Edge 113+, Safari 18+');
            console.warn('→ WebGLにフォールバックします');
        } else {
            console.log('✅ WebGPU is available!');
            console.log('GPU Adapter情報を取得中...');
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    console.log('GPU Adapter:', adapter);
                    const info = await adapter.requestAdapterInfo?.();
                    if (info) {
                        console.log('GPU情報:', {
                            vendor: info.vendor,
                            architecture: info.architecture,
                            device: info.device,
                            description: info.description
                        });
                    }
                }
            } catch (e) {
                console.warn('GPU情報の取得に失敗:', e);
            }
        }

        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000510);
        this.scene.fog = new THREE.Fog(0x000510, 100, 300);

        // カメラの作成
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 150);

        // WebGPUレンダラーの作成
        this.renderer = new WebGPURenderer({
            antialias: true,
            forceWebGL: false // WebGPUを優先、利用不可時は自動的にWebGLフォールバック
        });

        try {
            await this.renderer.init();
            console.log('WebGPUレンダラーの初期化に成功');
        } catch (error) {
            console.error('レンダラーの初期化に失敗:', error);
            document.getElementById('loading').textContent = 'レンダラーの初期化に失敗しました';
            return;
        }

        // パフォーマンス最適化のためPixelRatioを1に固定
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // WebGPU最適化設定
        this.renderer.info.autoReset = false; // 手動でリセット

        this.container.appendChild(this.renderer.domElement);

        // レンダラータイプを表示
        const rendererType = this.renderer.backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL (Fallback)';
        document.getElementById('renderer-type').textContent = rendererType;
        console.log(`使用中のレンダラー: ${rendererType}`);

        // コントロールの作成
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 10, 0);

        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // 各システムの初期化
        await this.initSystems();

        // イベントリスナー
        this.setupEventListeners();

        // ローディング画面を非表示
        document.getElementById('loading').style.display = 'none';

        // アニメーションループ開始
        this.animate();
    }

    async initSystems() {
        console.log('システムの初期化を開始...');

        // スタジアムの構築
        this.stadium = new Stadium();
        this.scene.add(this.stadium.group);

        // ステージの構築
        this.stage = new Stage();
        this.scene.add(this.stage.group);

        // 照明システム
        this.lightingSystem = new LightingSystem(this.scene);
        this.lightingSystem.init();

        // 観客の生成（8万人）
        this.audience = new Audience(80000);
        await this.audience.init();
        this.scene.add(this.audience.group);

        // 観客数の表示
        document.getElementById('audience-count').textContent =
            this.audience.count.toLocaleString();

        // ペンライトシステム
        this.penlightSystem = new PenlightSystem(this.audience);
        await this.penlightSystem.init();
        this.scene.add(this.penlightSystem.group);

        // スクリーンシステム
        this.screenSystem = new ScreenSystem();
        await this.screenSystem.init();
        this.scene.add(this.screenSystem.group);

        // 音楽同期システム（3D空間音響）
        this.audioSync = new AudioSync(this.camera, this.scene);
        await this.audioSync.init();

        // Coldplayの曲を読み込み
        await this.audioSync.loadAudioFile('/a_sky_full_of_stars.mp3');

        console.log('すべてのシステムの初期化が完了しました');

        // ローディング画面を非表示
        document.getElementById('loading').style.display = 'none';

        // 音楽を自動再生（最初のユーザー操作で開始）
        this.setupAutoplay();
    }

    setupAutoplay() {
        console.log('🎵 最初のクリックで音楽を開始します...');

        // 一度だけ実行されるイベントリスナー
        const startAudio = async () => {
            console.log('🎵 ユーザー操作を検出。音楽を開始します...');
            await this.audioSync.play();

            // イベントリスナーを削除
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };

        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
    }

    showPlayButton() {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <button id="play-button" style="
                padding: 20px 40px;
                font-size: 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s;
            ">
                🎵 Start Concert 🎵
            </button>
        `;

        const playButton = document.getElementById('play-button');
        playButton.addEventListener('mouseover', () => {
            playButton.style.transform = 'scale(1.1)';
        });
        playButton.addEventListener('mouseout', () => {
            playButton.style.transform = 'scale(1.0)';
        });
        playButton.addEventListener('click', async () => {
            await this.audioSync.play();
            loading.style.display = 'none';
        });
    }

    setupEventListeners() {
        // リサイズ
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // スペースキーで音楽の再生/一時停止
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.audioSync.toggle();
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            document.getElementById('fps').textContent = this.fps;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        const frameCount = Math.floor(elapsedTime * 60); // 60fps基準のフレームカウント

        // 各システムの更新（更新頻度を最適化）
        if (this.stage) {
            this.stage.update(elapsedTime);
        }

        // 観客は2フレームに1回更新（30fps相当）
        if (frameCount % 2 === 0) {
            if (this.audience) {
                this.audience.update(elapsedTime, deltaTime);
            }
        }

        // ペンライトは毎フレーム更新（60fps）で滑らかに
        if (this.penlightSystem) {
            const audioData = this.audioSync.getAudioData();
            this.penlightSystem.update(elapsedTime, audioData);
        }

        // 照明は毎フレーム更新（重要な演出）
        if (this.lightingSystem) {
            const audioData = this.audioSync.getAudioData();
            this.lightingSystem.update(elapsedTime, audioData);
        }

        if (this.screenSystem) {
            this.screenSystem.update(deltaTime);
        }

        // コントロールの更新
        this.controls.update();

        // FPS計測
        this.updateFPS();

        // レンダリング
        this.renderer.render(this.scene, this.camera);

        // レンダラー情報を手動でリセット（パフォーマンス向上）
        if (frameCount % 60 === 0) {
            this.renderer.info.reset();
        }
    }
}

// アプリケーション起動
new ColdplayConcert();
