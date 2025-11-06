import * as THREE from 'three';

export class Audience {
    constructor(count = 80000) {
        this.count = count;
        this.group = new THREE.Group();
        this.instancedMeshes = [];
        this.animationData = [];
    }

    async init() {
        // アリーナ席の観客
        await this.createArenaAudience();

        // スタンド席の観客
        await this.createStandAudience();

        console.log(`${this.count}人の観客を生成しました`);
    }

    async createArenaAudience() {
        const arenaCount = 10000; // アリーナ席: 10,000人

        // シンプルな人型ジオメトリ（体）
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });

        const bodyMesh = new THREE.InstancedMesh(
            bodyGeometry,
            bodyMaterial,
            arenaCount
        );

        // 頭のジオメトリ
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd0b0,
            roughness: 0.9,
            metalness: 0.1
        });

        const headMesh = new THREE.InstancedMesh(
            headGeometry,
            headMaterial,
            arenaCount
        );

        // アリーナエリアに配置
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // アリーナ席の配置範囲
        const arenaInnerRadius = 10;
        const arenaOuterRadius = 95;

        for (let i = 0; i < arenaCount; i++) {
            let x, z;
            let validPosition = false;

            // ステージエリアを避けた配置（ステージ後方のみ除外）
            while (!validPosition) {
                const angle = Math.random() * Math.PI * 2;
                const radius =
                    arenaInnerRadius +
                    Math.random() * (arenaOuterRadius - arenaInnerRadius)
                x = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius+5;

                // メインステージエリアを避ける（z < -50のエリアのみ）
                const isInStageArea = z < -50 && Math.abs(x) < 35;
                // ステージ後方全体を除外（z < -300の全エリア）
                const isBehindStage = z < -70;
                // 花道を避ける（z: -55 ~ 10, x: ±4の範囲）- 幅を狭めて周辺まで配置
                const isInRunway = z > -55 && z < 10 && Math.abs(x) < 4;
                // センターステージを避ける（半径8.3以内）- エッジライトすれすれまで配置
                const distFromCenterStage = Math.sqrt(x * x + Math.pow(z - 5, 2));
                const isInCenterStage = distFromCenterStage < 8.3;

                // 花道、センターステージ、メインステージ、ステージ後方を除外
                if (!isInStageArea && !isBehindStage && !isInRunway && !isInCenterStage) {
                    validPosition = true;
                }
            }

            // 少しランダムな高さの変化
            const y = 0.2 + Math.random() * 0.2;

            position.set(x, y, z);

            // ステージの方を向く
            const angleToStage = Math.atan2(-z - 70, -x);
            rotation.set(0, angleToStage + Math.PI / 2, 0);
            quaternion.setFromEuler(rotation);

            // 体のマトリックス
            matrix.compose(position, quaternion, scale);
            bodyMesh.setMatrixAt(i, matrix);

            // 頭の位置（体の上）
            position.y += 1.2;
            matrix.compose(position, quaternion, scale);
            headMesh.setMatrixAt(i, matrix);

            // アニメーション用データ
            this.animationData.push({
                originalY: y,
                phase: Math.random() * Math.PI * 2,
                frequency: 0.8 + Math.random() * 0.4,
                amplitude: 0.15 + Math.random() * 0.15,
                position: new THREE.Vector3(x, y, z),
                bodyIndex: i,
                headOffset: 1.2
            });
        }

        bodyMesh.instanceMatrix.needsUpdate = true;
        headMesh.instanceMatrix.needsUpdate = true;

        this.group.add(bodyMesh);
        this.group.add(headMesh);

        this.instancedMeshes.push({ body: bodyMesh, head: headMesh, type: 'arena' });
    }

    async createStandAudience() {
        const standCount = this.count - 10000; // スタンド席: 70,000人

        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.8,
            metalness: 0.2
        });

        const bodyMesh = new THREE.InstancedMesh(
            bodyGeometry,
            bodyMaterial,
            standCount
        );

        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd0b0,
            roughness: 0.9,
            metalness: 0.1
        });

        const headMesh = new THREE.InstancedMesh(
            headGeometry,
            headMaterial,
            standCount
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // スタンド席の4層配置
        let currentIndex = 0;

        for (let layer = 0; layer < 4; layer++) {
            const layerCount = Math.floor(standCount / 4);
            const innerRadius = 105 + layer * 20;
            const outerRadius = innerRadius + 15;
            const baseHeight = layer * 15;
            const seatRows = 15;  // 増やして密度を上げる

            for (let i = 0; i < layerCount && currentIndex < standCount; i++) {
                let x, z;
                let validPosition = false;

                // メインステージ後方のスタンドを除外
                while (!validPosition) {
                    const angle = (Math.random() * Math.PI * 2);
                    const row = Math.floor(Math.random() * seatRows);
                    const radius = innerRadius + (row / seatRows) * (outerRadius - innerRadius);

                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;

                    // ステージ後方のスタンドを除外（z < -40）
                    if (z >= -40) {
                        validPosition = true;
                    }
                }

                const row = Math.floor(Math.random() * seatRows);
                const y = baseHeight + row * 1.5 + 0.5;

                position.set(x, y, z);

                // ステージの方を向く
                const angleToStage = Math.atan2(-z - 70, -x);
                rotation.set(0, angleToStage + Math.PI / 2, 0);
                quaternion.setFromEuler(rotation);

                // 体
                matrix.compose(position, quaternion, scale);
                bodyMesh.setMatrixAt(currentIndex, matrix);

                // 頭
                position.y += 1.2;
                matrix.compose(position, quaternion, scale);
                headMesh.setMatrixAt(currentIndex, matrix);

                // アニメーション用データ
                this.animationData.push({
                    originalY: y,
                    phase: Math.random() * Math.PI * 2,
                    frequency: 0.8 + Math.random() * 0.4,
                    amplitude: 0.1 + Math.random() * 0.1,
                    position: new THREE.Vector3(x, y, z),
                    bodyIndex: currentIndex + 10000, // オフセット（アリーナ10,000人分）
                    headOffset: 1.2
                });

                currentIndex++;
            }
        }

        bodyMesh.instanceMatrix.needsUpdate = true;
        headMesh.instanceMatrix.needsUpdate = true;

        this.group.add(bodyMesh);
        this.group.add(headMesh);

        this.instancedMeshes.push({ body: bodyMesh, head: headMesh, type: 'stand' });
    }

    update(time, deltaTime) {
        // 観客がリズムに合わせて上下に動くアニメーション
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // パフォーマンス最適化：観客の一部のみ更新
        const updateRatio = 0.3; // 30%の観客のみ更新
        const frameOffset = Math.floor(time * 60) % 10;

        // フレームごとに異なる観客を更新
        const startIndex = Math.floor(this.animationData.length * frameOffset / 10);
        const endIndex = Math.floor(this.animationData.length * (frameOffset + updateRatio * 10) / 10);

        for (let index = startIndex; index < endIndex; index++) {
            if (index >= this.animationData.length) break;
            const data = this.animationData[index];

            // ウェーブ効果
            const wave = Math.sin(time * data.frequency + data.phase);
            const newY = data.originalY + wave * data.amplitude;

            // 腕を上げる動き（簡易的にスケールで表現）
            const armRaise = Math.max(0, wave);
            const bodyScale = new THREE.Vector3(1, 1 + armRaise * 0.2, 1);

            // 体の更新
            position.copy(data.position);
            position.y = newY;

            const angleToStage = Math.atan2(-position.z - 70, -position.x);
            const euler = new THREE.Euler(0, angleToStage + Math.PI / 2, 0);
            quaternion.setFromEuler(euler);

            matrix.compose(position, quaternion, bodyScale);

            // どのメッシュに属するか判定（アリーナ10,000人、スタンド70,000人）
            if (index < 10000) {
                this.instancedMeshes[0].body.setMatrixAt(index, matrix);
            } else {
                this.instancedMeshes[1].body.setMatrixAt(
                    index - 10000,
                    matrix
                );
            }

            // 頭の更新
            position.y += data.headOffset;
            matrix.compose(position, quaternion, scale);

            if (index < 10000) {
                this.instancedMeshes[0].head.setMatrixAt(index, matrix);
            } else {
                this.instancedMeshes[1].head.setMatrixAt(
                    index - 10000,
                    matrix
                );
            }
        }

        // インスタンスマトリックスの更新フラグ
        this.instancedMeshes.forEach((mesh) => {
            mesh.body.instanceMatrix.needsUpdate = true;
            mesh.head.instanceMatrix.needsUpdate = true;
        });
    }
}
