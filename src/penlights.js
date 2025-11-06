import * as THREE from 'three';

export class PenlightSystem {
    constructor(audience) {
        this.audience = audience;
        this.group = new THREE.Group();
        this.penlights = null;
        this.colorPatterns = [
            new THREE.Color(0xff0000), // 赤
            new THREE.Color(0x00ff00), // 緑
            new THREE.Color(0x0000ff), // 青
            new THREE.Color(0xffff00), // 黄
            new THREE.Color(0xff00ff), // マゼンタ
            new THREE.Color(0x00ffff), // シアン
            new THREE.Color(0xffffff), // 白
            new THREE.Color(0xff8800), // オレンジ
        ];
        this.currentPattern = 'wave'; // wave, sync, random, section
        this.beatIntensity = 0;
    }

    async init() {
        const penlightCount = this.audience.count;

        // ペンライトのジオメトリ（小さな発光する棒）
        const penlightGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);

        // グラデーションテクスチャを作成（光のエフェクト用）
        const penlightTexture = this.createGlowTexture();

        // 発光マテリアル - 加算合成で光を強調
        const penlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: penlightTexture,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,  // 加算合成
            side: THREE.DoubleSide,
            depthWrite: false  // 透過処理を正しく
        });

        this.penlights = new THREE.InstancedMesh(
            penlightGeometry,
            penlightMaterial,
            penlightCount
        );

        // インスタンスごとの色を設定
        const colors = new Float32Array(penlightCount * 3);
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        this.audience.animationData.forEach((data, index) => {
            // ペンライトの位置（観客の手の位置）
            position.copy(data.position);
            position.y = data.originalY + 1.8; // 頭より上
            position.x += (Math.random() - 0.5) * 0.3;

            // ランダムな傾き
            rotation.set(
                (Math.random() - 0.5) * 0.3,
                Math.random() * Math.PI * 2,
                (Math.random() - 0.5) * 0.3
            );
            quaternion.setFromEuler(rotation);

            matrix.compose(position, quaternion, scale);
            this.penlights.setMatrixAt(index, matrix);

            // 初期色（ランダム）
            const color = this.colorPatterns[
                Math.floor(Math.random() * this.colorPatterns.length)
            ];
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
        });

        this.penlights.instanceMatrix.needsUpdate = true;

        // インスタンスカラー属性を設定
        this.penlights.instanceColor = new THREE.InstancedBufferAttribute(
            colors,
            3
        );

        this.group.add(this.penlights);

        // 二重構造で光を強調（外側のグロー層）
        const glowGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: penlightTexture,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.penlightGlow = new THREE.InstancedMesh(
            glowGeometry,
            glowMaterial,
            penlightCount
        );

        // グロー層の色も設定
        this.penlightGlow.instanceColor = new THREE.InstancedBufferAttribute(
            new Float32Array(colors),
            3
        );

        // グロー層の位置もメインと同じにする
        this.audience.animationData.forEach((data, index) => {
            position.copy(data.position);
            position.y = data.originalY + 1.8;
            position.x += (Math.random() - 0.5) * 0.3;

            rotation.set(
                (Math.random() - 0.5) * 0.3,
                Math.random() * Math.PI * 2,
                (Math.random() - 0.5) * 0.3
            );
            quaternion.setFromEuler(rotation);

            matrix.compose(position, quaternion, scale);
            this.penlightGlow.setMatrixAt(index, matrix);
        });

        this.penlightGlow.instanceMatrix.needsUpdate = true;
        this.group.add(this.penlightGlow);

        // Point lights for glow effect (limited number for performance)
        this.createGlowLights();

        console.log('ペンライトシステムを初期化しました（二重構造 + 加算合成）');
    }

    // グロー用グラデーションテクスチャを生成
    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');

        // 縦方向のグラデーション
        const gradient = context.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }

    createGlowLights() {
        // パフォーマンスのため、代表的な位置にのみポイントライトを配置
        const glowLightCount = 50;

        for (let i = 0; i < glowLightCount; i++) {
            const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);

            // ランダムな位置（観客エリア内）
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 70;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = 5 + Math.random() * 30;

            pointLight.position.set(x, y, z);
            this.group.add(pointLight);
        }
    }

    update(time, audioData) {
        if (!this.penlights) return;

        const colors = this.penlights.instanceColor.array;
        const glowColors = this.penlightGlow.instanceColor.array;
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // 音楽データからビート強度を取得
        this.beatIntensity = audioData.beat || 0;

        // 全てのペンライトを毎フレーム更新（滑らかな動きのため）
        for (let index = 0; index < this.audience.animationData.length; index++) {
            const data = this.audience.animationData[index];
            let color;

            switch (this.currentPattern) {
                case 'wave':
                    color = this.getWaveColor(data.position, time);
                    break;
                case 'sync':
                    color = this.getSyncColor(time, audioData);
                    break;
                case 'section':
                    color = this.getSectionColor(data.position);
                    break;
                case 'random':
                default:
                    if (Math.random() < 0.01) {
                        // 1%の確率で色変更
                        color = this.colorPatterns[
                            Math.floor(Math.random() * this.colorPatterns.length)
                        ];
                    } else {
                        // 現在の色を維持
                        color = new THREE.Color(
                            colors[index * 3],
                            colors[index * 3 + 1],
                            colors[index * 3 + 2]
                        );
                    }
                    break;
            }

            // ビートに合わせて明るさを調整
            const brightness = 1.0 + this.beatIntensity * 0.5;

            colors[index * 3] = color.r * brightness;
            colors[index * 3 + 1] = color.g * brightness;
            colors[index * 3 + 2] = color.b * brightness;

            // グロー層も同じ色に（少し明るめ）
            const glowBrightness = brightness * 1.2;
            glowColors[index * 3] = color.r * glowBrightness;
            glowColors[index * 3 + 1] = color.g * glowBrightness;
            glowColors[index * 3 + 2] = color.b * glowBrightness;

            // ペンライトの位置を観客の動きに合わせて更新
            position.copy(data.position);

            // ビート検出時の急激な動き
            const beatPulse = this.beatIntensity * this.beatIntensity; // 二乗で強調

            // ビートに合わせて上下動きの速度を調整（1.0倍～3.0倍）
            const beatSpeedMultiplier = 1.0 + this.beatIntensity * 2.0;

            // 滑らかな3段階の上下動き（下→中→上→中→下）- ビートで速度変化
            const baseWave = Math.sin(time * 10 * beatSpeedMultiplier + index * 0.1); // 基本波
            const midWave = Math.sin(time * 5 * beatSpeedMultiplier + index * 0.2) * 0.5; // 中間波
            const fineWave = Math.sin(time * 8 * beatSpeedMultiplier + index * 0.3) * 0.3; // 細かい振動

            // イージング関数で滑らかに（-1~1 → 0~1への変換と滑らか化）
            const easeWave = (baseWave + 1) / 2; // 0~1の範囲に変換
            const smoothWave = easeWave * easeWave * (3 - 2 * easeWave); // smoothstep関数

            // 下(0) → 中(0.5) → 上(1) → 中(0.5) → 下(0)の動き
            const normalizedWave = (smoothWave - 0.5) * 2; // -1~1に戻す

            // ビートに合わせて振幅も大きく（1.0倍～2.0倍）
            const beatAmplitudeMultiplier = 1.0 + this.beatIntensity;

            // 観客の基本動きと組み合わせ
            const audienceWave = Math.sin(time * data.frequency + data.phase);
            position.y = data.originalY + 1.8 +
                        audienceWave * data.amplitude * 0.3 + // 観客の動き（抑え目）
                        normalizedWave * 0.5 * beatAmplitudeMultiplier + // 基本的な上下動き（ビートで振幅変化）
                        midWave * 0.2 * beatAmplitudeMultiplier + // 中間の変動（ビートで振幅変化）
                        fineWave * 0.1; // 細かい振動

            // ビートに合わせて激しく上下に跳ねる動き
            if (this.beatIntensity > 0.3) {
                // ビート検出時に瞬間的に大きく上に跳ね上がる
                const beatJump = beatPulse * 1.2; // ビート強度に応じたジャンプ

                // 各ペンライトに個性を持たせる（位置によって反応タイミングをずらす）
                const individualOffset = (index % 10) * 0.1;
                const beatWave = Math.max(0, Math.sin(time * 15 * beatSpeedMultiplier + individualOffset)); // 0以上のみ（ビートで速度変化）

                // ビート時のジャンプ（急激な上昇）
                position.y += beatJump * beatWave * 0.8;

                // ビート時の左右の揺れも追加
                const beatShake = Math.sin(time * 20 * beatSpeedMultiplier + index * 0.2) * beatPulse * 0.15;
                position.x += beatShake;
            }

            // 滑らかな回転（ビートに合わせて激しく）
            const beatRotationSpeed = 1.5 + beatPulse * 2.0; // ビート時に回転速度アップ
            const baseRotation = time * beatRotationSpeed + index * 0.02;
            const tiltX = Math.sin(time * 2 + index * 0.1) * (0.08 + beatPulse * 0.15);
            const tiltZ = Math.cos(time * 1.5 + index * 0.15) * (0.08 + beatPulse * 0.15);

            // ビート時にさらに激しく振る
            const beatTilt = beatPulse * Math.sin(time * 25 + index) * 0.3;

            const rotation = new THREE.Euler(
                tiltX + beatTilt,
                baseRotation,
                tiltZ + beatTilt * 0.5
            );
            quaternion.setFromEuler(rotation);

            matrix.compose(position, quaternion, scale);
            this.penlights.setMatrixAt(index, matrix);

            // グロー層も同じ位置に
            this.penlightGlow.setMatrixAt(index, matrix);
        }

        this.penlights.instanceColor.needsUpdate = true;
        this.penlights.instanceMatrix.needsUpdate = true;
        this.penlightGlow.instanceColor.needsUpdate = true;
        this.penlightGlow.instanceMatrix.needsUpdate = true;

        // パターンをランダムに変更（30秒ごと）
        if (Math.floor(time) % 30 === 0 && time % 1 < 0.016) {
            this.changePattern();
        }
    }

    getWaveColor(position, time) {
        // 位置と時間に基づいたウェーブカラー（ビートで速度変化）
        const angle = Math.atan2(position.z, position.x);
        const dist = Math.sqrt(position.x ** 2 + position.z ** 2);
        // ビート強度でウェーブ速度を加速（1.0~2.0倍速）
        const beatSpeedMultiplier = 1.0 + this.beatIntensity;
        const waveValue = Math.sin(angle * 3 + time * 2 * beatSpeedMultiplier + dist * 0.1);
        const colorIndex = Math.floor(
            ((waveValue + 1) / 2) * this.colorPatterns.length
        );
        return this.colorPatterns[colorIndex % this.colorPatterns.length];
    }

    getSyncColor(time, audioData) {
        // 全員が同じ色で同期（ビートに合わせて変化）
        // ビート強度で色変化速度を調整（0.5~1.5倍速）
        const beatSpeedMultiplier = 0.5 + this.beatIntensity;
        const colorIndex = Math.floor(time * beatSpeedMultiplier) % this.colorPatterns.length;
        return this.colorPatterns[colorIndex];
    }

    getSectionColor(position) {
        // セクションごとに異なる色
        const angle = Math.atan2(position.z, position.x);
        const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
        const sectionIndex = Math.floor(normalizedAngle * 8);
        return this.colorPatterns[sectionIndex % this.colorPatterns.length];
    }

    changePattern() {
        const patterns = ['wave', 'sync', 'section', 'random'];
        const currentIndex = patterns.indexOf(this.currentPattern);
        this.currentPattern = patterns[(currentIndex + 1) % patterns.length];
        console.log('ペンライトパターン変更:', this.currentPattern);
    }

    setPattern(pattern) {
        if (['wave', 'sync', 'section', 'random'].includes(pattern)) {
            this.currentPattern = pattern;
        }
    }
}
