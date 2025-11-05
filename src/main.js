import * as THREE from 'three';
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

        this.cameraViews = [
            { position: [0, 50, 150], target: [0, 10, 0], name: '全体ビュー' },
            { position: [0, 5, 50], target: [0, 3, 0], name: 'ステージ正面' },
            { position: [0, 30, 0], target: [0, 0, -30], name: '花道センター' },
            { position: [-80, 40, 0], target: [0, 10, 0], name: '客席サイド' }
        ];
        this.currentViewIndex = 0;

        this.init();
    }

    async init() {
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

        // WebGLレンダラーの作成（高性能設定）
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // パフォーマンス最適化
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = false; // パフォーマンスのためシャドウは無効
        this.container.appendChild(this.renderer.domElement);

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

        // 観客の生成（5万人）
        this.audience = new Audience(50000);
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

        // 音楽同期システム
        this.audioSync = new AudioSync();

        console.log('すべてのシステムの初期化が完了しました');
    }

    setupEventListeners() {
        // リサイズ
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // 音楽開始ボタン
        document.getElementById('play-music').addEventListener('click', () => {
            this.audioSync.toggle();
        });

        // カメラビュー切替
        document.getElementById('camera-view').addEventListener('click', () => {
            this.switchCameraView();
        });

        // 照明強度スライダー
        document.getElementById('light-intensity').addEventListener('input', (e) => {
            const intensity = parseFloat(e.target.value) / 100;
            this.lightingSystem.setIntensity(intensity);
        });
    }

    switchCameraView() {
        this.currentViewIndex = (this.currentViewIndex + 1) % this.cameraViews.length;
        const view = this.cameraViews[this.currentViewIndex];

        this.camera.position.set(...view.position);
        this.controls.target.set(...view.target);
        this.controls.update();
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

        // 各システムの更新
        if (this.audience) {
            this.audience.update(elapsedTime, deltaTime);
        }

        if (this.penlightSystem) {
            const audioData = this.audioSync.getAudioData();
            this.penlightSystem.update(elapsedTime, audioData);
        }

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
    }
}

// アプリケーション起動
new ColdplayConcert();
