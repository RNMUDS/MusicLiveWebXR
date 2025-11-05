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
        const penlightGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);

        // 発光マテリアル
        const penlightMaterial = new THREE.MeshStandardMaterial({
            emissive: 0xffffff,
            emissiveIntensity: 2.0,
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.7
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

        // Point lights for glow effect (limited number for performance)
        this.createGlowLights();

        console.log('ペンライトシステムを初期化しました');
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
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // 音楽データからビート強度を取得
        this.beatIntensity = audioData.beat || 0;

        // パターンに応じた色変更
        this.audience.animationData.forEach((data, index) => {
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

            // ペンライトの位置を観客の動きに合わせて更新
            position.copy(data.position);

            // 観客の上下動きに合わせる
            const wave = Math.sin(time * data.frequency + data.phase);
            position.y = data.originalY + 1.8 + wave * data.amplitude;

            // ビートに合わせてランダムに振る
            if (this.beatIntensity > 0.7) {
                position.x += (Math.random() - 0.5) * 0.2;
                position.z += (Math.random() - 0.5) * 0.2;
            }

            // 回転（ペンライトを振る動き）
            const rotation = new THREE.Euler(
                Math.sin(time * 2 + index) * 0.5,
                time * 0.5 + index,
                Math.cos(time * 1.5 + index) * 0.5
            );
            quaternion.setFromEuler(rotation);

            matrix.compose(position, quaternion, scale);
            this.penlights.setMatrixAt(index, matrix);
        });

        this.penlights.instanceColor.needsUpdate = true;
        this.penlights.instanceMatrix.needsUpdate = true;

        // パターンをランダムに変更（30秒ごと）
        if (Math.floor(time) % 30 === 0 && time % 1 < 0.016) {
            this.changePattern();
        }
    }

    getWaveColor(position, time) {
        // 位置と時間に基づいたウェーブカラー
        const angle = Math.atan2(position.z, position.x);
        const dist = Math.sqrt(position.x ** 2 + position.z ** 2);
        const waveValue = Math.sin(angle * 3 + time * 2 + dist * 0.1);
        const colorIndex = Math.floor(
            ((waveValue + 1) / 2) * this.colorPatterns.length
        );
        return this.colorPatterns[colorIndex % this.colorPatterns.length];
    }

    getSyncColor(time, audioData) {
        // 全員が同じ色で同期（ビートに合わせて変化）
        const colorIndex = Math.floor(time * 0.5) % this.colorPatterns.length;
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
