import * as THREE from 'three';

export class ScreenSystem {
    constructor() {
        this.group = new THREE.Group();
        this.screens = [];
        this.videoTexture = null;
        this.videoElement = null;
        this.cameraActive = false;
    }

    async init() {
        // ビデオ要素の作成
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;

        // 大画面スクリーンの作成
        this.createMainScreens();

        // サイドスクリーンの作成
        this.createSideScreens();

        // デフォルトテクスチャ（カメラ起動前）
        this.createDefaultTexture();

        console.log('スクリーンシステムを初期化しました');
    }

    createDefaultTexture() {
        // カメラが起動していない時のデフォルト表示
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // グラデーション背景
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ffff00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // テキスト
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COLDPLAY', 256, 200);
        ctx.font = 'bold 36px Arial';
        ctx.fillText('LIVE CONCERT', 256, 280);
        ctx.font = '24px Arial';
        ctx.fillText('Click to enable camera', 256, 350);

        this.videoTexture = new THREE.CanvasTexture(canvas);
        this.videoTexture.needsUpdate = true;

        // スクリーンに適用
        this.screens.forEach((screen) => {
            screen.material.map = this.videoTexture;
            screen.material.needsUpdate = true;
        });
    }

    createMainScreens() {
        // メインステージ後方の大型スクリーン（3枚）
        const screenConfigs = [
            { position: [-25, 22, -90], size: [20, 12] },
            { position: [0, 22, -90], size: [20, 12] },
            { position: [25, 22, -90], size: [20, 12] },
        ];

        screenConfigs.forEach((config) => {
            const screenGeometry = new THREE.PlaneGeometry(...config.size);
            const screenMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
            });

            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(...config.position);

            this.group.add(screen);
            this.screens.push(screen);

            // スクリーンフレーム
            const frameGeometry = new THREE.BoxGeometry(
                config.size[0] + 1,
                config.size[1] + 1,
                0.5
            );
            const frameMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.8,
                roughness: 0.2,
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(config.position[0], config.position[1], config.position[2] - 0.3);
            this.group.add(frame);
        });
    }

    createSideScreens() {
        // サイドスクリーン（観客席向け）
        const sideConfigs = [
            { position: [-70, 25, -30], rotation: [0, Math.PI / 4, 0], size: [15, 10] },
            { position: [70, 25, -30], rotation: [0, -Math.PI / 4, 0], size: [15, 10] },
            { position: [-70, 25, 20], rotation: [0, Math.PI / 4, 0], size: [12, 8] },
            { position: [70, 25, 20], rotation: [0, -Math.PI / 4, 0], size: [12, 8] },
        ];

        sideConfigs.forEach((config) => {
            const screenGeometry = new THREE.PlaneGeometry(...config.size);
            const screenMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
            });

            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(...config.position);
            screen.rotation.set(...config.rotation);

            this.group.add(screen);
            this.screens.push(screen);

            // フレーム
            const frameGeometry = new THREE.BoxGeometry(
                config.size[0] + 0.8,
                config.size[1] + 0.8,
                0.4
            );
            const frameMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.8,
                roughness: 0.2,
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.copy(screen.position);
            frame.rotation.copy(screen.rotation);
            frame.position.z -= 0.2;
            this.group.add(frame);
        });
    }

    async startCamera() {
        if (this.cameraActive) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: false,
            });

            this.videoElement.srcObject = stream;
            await this.videoElement.play();

            // ビデオテクスチャの作成
            this.videoTexture = new THREE.VideoTexture(this.videoElement);
            this.videoTexture.minFilter = THREE.LinearFilter;
            this.videoTexture.magFilter = THREE.LinearFilter;

            // すべてのスクリーンに適用
            this.screens.forEach((screen) => {
                screen.material.map = this.videoTexture;
                screen.material.needsUpdate = true;
            });

            this.cameraActive = true;
            console.log('カメラを起動しました');
        } catch (error) {
            console.error('カメラの起動に失敗:', error);
            alert('カメラへのアクセスが拒否されました。デフォルト表示を使用します。');
        }
    }

    stopCamera() {
        if (!this.cameraActive) return;

        const stream = this.videoElement.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
        }

        this.videoElement.srcObject = null;
        this.cameraActive = false;

        // デフォルトテクスチャに戻す
        this.createDefaultTexture();

        console.log('カメラを停止しました');
    }

    update(deltaTime) {
        // ビデオテクスチャの更新は自動的に行われる
        if (this.videoTexture && this.cameraActive) {
            this.videoTexture.needsUpdate = true;
        }
    }

    // エフェクト適用
    applyEffect(effectName) {
        switch (effectName) {
            case 'grayscale':
                this.screens.forEach((screen) => {
                    screen.material.color.setHex(0x888888);
                });
                break;
            case 'tint':
                const tintColors = [0xff00ff, 0x00ffff, 0xffff00];
                this.screens.forEach((screen, index) => {
                    screen.material.color.setHex(
                        tintColors[index % tintColors.length]
                    );
                });
                break;
            case 'normal':
            default:
                this.screens.forEach((screen) => {
                    screen.material.color.setHex(0xffffff);
                });
                break;
        }
    }
}
