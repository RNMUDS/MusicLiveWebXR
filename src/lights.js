import * as THREE from 'three';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.spotlights = [];
        this.movingHeads = [];
        this.intensity = 0.7;
        this.colors = [
            0x88ccff, // ライトブルー
            0xaaddff, // スカイブルー
            0xccffff, // アイスホワイト
            0x6699ff, // ブルー
            0x99ccff, // ペールブルー
            0xbbddff, // ソフトブルー
            0xddeeff, // ホワイトブルー
            0x77aaff, // クールブルー
        ];
        // InstancedMeshを保持
        this.spotlightHelpers = null;
        this.movingHeadMeshes = null;
    }

    init() {
        // メインステージライト
        this.createStageSpotlights();

        // ムービングヘッドライト（動くライト）
        this.createMovingHeads();

        // バックライト
        this.createBacklights();

        // サイドライト
        this.createSideLights();

        // オーディエンスライト
        this.createAudienceLights();

        console.log('照明システムを初期化しました');
    }

    createStageSpotlights() {
        // ステージ正面からのスポットライト
        const spotPositions = [
            [-20, 25, -40],
            [0, 25, -40],
            [20, 25, -40],
            [-10, 30, -30],
            [10, 30, -30],
        ];

        // InstancedMeshでライトヘルパーを作成
        const helperGeometry = new THREE.ConeGeometry(0.5, 1, 8);
        const helperMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8,
        });
        this.spotlightHelpers = new THREE.InstancedMesh(
            helperGeometry,
            helperMaterial,
            spotPositions.length
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        const colors = new Float32Array(spotPositions.length * 3);

        spotPositions.forEach((pos, index) => {
            const spotlight = new THREE.SpotLight(
                this.colors[index % this.colors.length],
                3,
                100,
                Math.PI / 6,
                0.5,
                2
            );
            spotlight.position.set(...pos);
            spotlight.target.position.set(pos[0] * 0.3, 2, -70);
            spotlight.castShadow = false; // パフォーマンスのためシャドウオフ

            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
            this.spotlights.push({
                light: spotlight,
                originalColor: this.colors[index % this.colors.length],
                phase: Math.random() * Math.PI * 2,
                helperIndex: index,
            });

            // InstancedMeshのマトリックスを設定
            position.set(...pos);
            rotation.set(Math.PI, 0, 0);
            quaternion.setFromEuler(rotation);
            matrix.compose(position, quaternion, scale);
            this.spotlightHelpers.setMatrixAt(index, matrix);

            // インスタンスカラーを設定
            const color = new THREE.Color(this.colors[index % this.colors.length]);
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
        });

        this.spotlightHelpers.instanceMatrix.needsUpdate = true;
        this.spotlightHelpers.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
        this.scene.add(this.spotlightHelpers);
    }

    createMovingHeads() {
        // トラスに取り付けられたムービングヘッドライト
        const positions = [
            [-30, 20, -70],
            [-15, 20, -70],
            [0, 20, -70],
            [15, 20, -70],
            [30, 20, -70],
            [-20, 25, -50],
            [20, 25, -50],
        ];

        // InstancedMeshでムービングヘッド本体を作成
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 1.2);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.1,
        });
        this.movingHeadMeshes = new THREE.InstancedMesh(
            headGeometry,
            headMaterial,
            positions.length
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        const colors = new Float32Array(positions.length * 3);

        positions.forEach((pos, index) => {
            const movingLight = new THREE.SpotLight(
                0xffffff,
                2,
                80,
                Math.PI / 4,
                0.3,
                1.5
            );
            movingLight.position.set(...pos);

            const target = new THREE.Object3D();
            target.position.set(0, 1, 0);
            this.scene.add(target);
            movingLight.target = target;

            this.scene.add(movingLight);

            this.movingHeads.push({
                light: movingLight,
                target: target,
                phase: (index / positions.length) * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                radius: 30 + Math.random() * 20,
                height: 1 + Math.random() * 3,
                meshIndex: index,
            });

            // InstancedMeshのマトリックスを設定
            position.set(...pos);
            matrix.compose(position, quaternion, scale);
            this.movingHeadMeshes.setMatrixAt(index, matrix);

            // エミッシブカラーを設定
            const emissiveColor = new THREE.Color(this.colors[index % this.colors.length]);
            colors[index * 3] = emissiveColor.r * 0.3;
            colors[index * 3 + 1] = emissiveColor.g * 0.3;
            colors[index * 3 + 2] = emissiveColor.b * 0.3;
        });

        this.movingHeadMeshes.instanceMatrix.needsUpdate = true;

        // エミッシブカラー用の属性を追加
        const emissiveAttribute = new THREE.InstancedBufferAttribute(colors, 3);
        this.movingHeadMeshes.geometry.setAttribute('instanceEmissive', emissiveAttribute);

        this.scene.add(this.movingHeadMeshes);
    }

    createBacklights() {
        // ステージ後方からのバックライト
        const backLightPositions = [
            [-25, 15, -85],
            [0, 15, -85],
            [25, 15, -85],
        ];

        backLightPositions.forEach((pos, index) => {
            const backLight = new THREE.SpotLight(
                this.colors[(index + 3) % this.colors.length],
                2.5,
                70,
                Math.PI / 3,
                0.4,
                1.5
            );
            backLight.position.set(...pos);
            backLight.target.position.set(pos[0], 5, -60);

            this.scene.add(backLight);
            this.scene.add(backLight.target);
            this.lights.push({
                light: backLight,
                type: 'back',
                phase: index * Math.PI / 3,
            });
        });
    }

    createSideLights() {
        // サイドライト（左右から）
        const sidePositions = [
            [-50, 15, -70],
            [50, 15, -70],
            [-50, 15, -30],
            [50, 15, -30],
            [-50, 15, 10],
            [50, 15, 10],
        ];

        sidePositions.forEach((pos, index) => {
            const sideLight = new THREE.SpotLight(
                this.colors[index % this.colors.length],
                1.5,
                80,
                Math.PI / 5,
                0.5,
                2
            );
            sideLight.position.set(...pos);
            sideLight.target.position.set(0, 2, pos[2]);

            this.scene.add(sideLight);
            this.scene.add(sideLight.target);
            this.lights.push({
                light: sideLight,
                type: 'side',
                phase: index * Math.PI / 6,
            });
        });
    }

    createAudienceLights() {
        // 観客席を照らすライト（スタンドの各セクション）
        const sections = 8;
        for (let i = 0; i < sections; i++) {
            const angle = (Math.PI * 2 * i) / sections;
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const audienceLight = new THREE.SpotLight(
                0x4444ff,
                1.0,
                100,
                Math.PI / 3,
                0.8,
                2
            );
            audienceLight.position.set(x, 50, z);
            audienceLight.target.position.set(x * 0.7, 10, z * 0.7);

            this.scene.add(audienceLight);
            this.scene.add(audienceLight.target);
            this.lights.push({
                light: audienceLight,
                type: 'audience',
                phase: angle,
            });
        }
    }

    update(time, audioData) {
        const beatIntensity = audioData.beat || 0;

        // ムービングヘッドの動き
        this.movingHeads.forEach((mh) => {
            const angle = time * mh.speed + mh.phase;
            mh.target.position.x = Math.cos(angle) * mh.radius;
            mh.target.position.z = Math.sin(angle * 0.7) * mh.radius;
            mh.target.position.y = mh.height + Math.sin(angle * 2) * 2;

            // ビートに合わせて色変更
            if (beatIntensity > 0.8) {
                const colorIndex = Math.floor(Math.random() * this.colors.length);
                mh.light.color.setHex(this.colors[colorIndex]);
            }

            // 強度変更
            mh.light.intensity = (2 + beatIntensity * 2) * this.intensity;
        });

        // スポットライトの点滅
        this.spotlights.forEach((spot) => {
            const flicker = Math.sin(time * 10 + spot.phase);
            spot.light.intensity = (3 + flicker * 0.5 + beatIntensity * 2) * this.intensity;

            // ランダムな色変更
            if (Math.random() < 0.01) {
                spot.light.color.setHex(
                    this.colors[Math.floor(Math.random() * this.colors.length)]
                );
            }
        });

        // その他のライトの更新
        this.lights.forEach((lightObj) => {
            const { light, type, phase } = lightObj;

            if (type === 'back') {
                const pulse = Math.sin(time * 2 + phase);
                light.intensity = (2.5 + pulse * 0.5 + beatIntensity) * this.intensity;
            } else if (type === 'side') {
                const wave = Math.sin(time * 1.5 + phase);
                light.intensity = (1.5 + wave * 0.3 + beatIntensity * 0.5) * this.intensity;

                // 色のサイクル
                if (Math.floor(time * 2) % 2 === 0) {
                    const colorIndex = (Math.floor(time / 5) + Math.floor(phase)) % this.colors.length;
                    light.color.setHex(this.colors[colorIndex]);
                }
            } else if (type === 'audience') {
                light.intensity = (1.0 + beatIntensity * 0.5) * this.intensity * 0.5;
            }
        });
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
        console.log('照明強度:', this.intensity);
    }

    // ストロボ効果
    strobe(duration = 2) {
        const interval = setInterval(() => {
            this.lights.forEach((lightObj) => {
                lightObj.light.intensity = Math.random() > 0.5 ? 5 : 0;
            });
            this.spotlights.forEach((spot) => {
                spot.light.intensity = Math.random() > 0.5 ? 8 : 0;
            });
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
        }, duration * 1000);
    }

    // ブラックアウト
    blackout() {
        this.lights.forEach((lightObj) => {
            lightObj.light.intensity = 0;
        });
        this.spotlights.forEach((spot) => {
            spot.light.intensity = 0;
        });
        this.movingHeads.forEach((mh) => {
            mh.light.intensity = 0;
        });
    }
}
