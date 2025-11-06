import * as THREE from 'three';

export class Stage {
    constructor() {
        this.group = new THREE.Group();
        this.glowingEdges = []; // アニメーション用のエッジ配列
        this.createStage();
    }

    createStage() {
        // メインステージ
        this.createMainStage();

        // 花道（runway）
        this.createRunway();

        // センターステージ（花道の先端）
        this.createCenterStage();

        // ステージ装飾
        this.createStageDecorations();
    }

    createMainStage() {
        // メインステージプラットフォーム
        const stageGeometry = new THREE.BoxGeometry(60, 3, 30);
        const stageMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.7
        });
        const stage = new THREE.Mesh(stageGeometry, stageMaterial);
        stage.position.set(0, 1.5, -70);
        this.group.add(stage);

        // ステージエッジのLEDライン - 加算合成で光らせる
        // グラデーションテクスチャを作成
        const edgeTexture = this.createGradientTexture();

        const edgeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,  // 蛍光グリーン
            map: edgeTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,  // 加算合成
            side: THREE.DoubleSide,
            depthWrite: false  // 透過処理を正しく
        });

        // 前面エッジ - 二重にして光を強調
        for (let i = 0; i < 2; i++) {
            const frontEdgeGeometry = new THREE.BoxGeometry(60, 0.4 + i * 0.2, 0.6 + i * 0.2);
            const frontEdge = new THREE.Mesh(frontEdgeGeometry, edgeMaterial.clone());
            frontEdge.position.set(0, 3.2, -55);
            this.group.add(frontEdge);
            this.glowingEdges.push({
                mesh: frontEdge,
                material: frontEdge.material,
                speed: 0.5 + i * 0.3
            });
        }

        // エッジ周辺のポイントライト（グロー効果強化）
        for (let i = 0; i < 8; i++) {
            const light = new THREE.PointLight(0x00ff00, 3, 20);
            light.position.set(-28 + i * 8, 3.2, -55);
            this.group.add(light);
        }

        // サイドエッジ - 二重構造
        for (let side of [-1, 1]) {
            for (let i = 0; i < 2; i++) {
                const sideEdgeGeometry = new THREE.BoxGeometry(0.6 + i * 0.2, 0.4 + i * 0.2, 30);
                const sideEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial.clone());
                sideEdge.position.set(side * 30, 3.2, -70);
                this.group.add(sideEdge);
                this.glowingEdges.push({
                    mesh: sideEdge,
                    material: sideEdge.material,
                    speed: 0.4 + i * 0.2
                });
            }
        }

        // ステージバック（機材エリア）
        const backGeometry = new THREE.BoxGeometry(60, 8, 5);
        const backMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.8,
            metalness: 0.5
        });
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(0, 4, -87);
        this.group.add(back);
    }

    createRunway() {
        // 花道のメインパス
        const runwayLength = 60;
        const runwayWidth = 8;

        const runwayGeometry = new THREE.BoxGeometry(runwayWidth, 2, runwayLength);
        const runwayMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.6
        });
        const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        runway.position.set(0, 1, -25);
        this.group.add(runway);

        // 花道のLEDストリップ（両サイド）- 加算合成で光らせる
        const runwayTexture = this.createGradientTexture();

        const ledMaterial = new THREE.MeshBasicMaterial({
            color: 0xff1493,  // 蛍光ピンク
            map: runwayTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // LEDストリップ用InstancedMesh（2本 x 2層 = 4本）
        const ledStripGeometry = new THREE.BoxGeometry(0.4, 0.4, runwayLength);
        const ledStripMesh = new THREE.InstancedMesh(ledStripGeometry, ledMaterial, 4);

        // LEDライトポイント用InstancedMesh（両サイド20個ずつ x 2層 = 80個）
        const numLights = 20;
        const lightGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const lightMesh = new THREE.InstancedMesh(lightGeometry, ledMaterial, numLights * 4);

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        let stripIndex = 0;
        let lightIndex = 0;

        // 両サイド x 2層の二重構造で光を強調
        for (let side of [-1, 1]) {
            for (let layer = 0; layer < 2; layer++) {
                const offset = layer * 0.15;

                // LEDストリップ
                position.set(side * (runwayWidth / 2), 2.2 + offset, -25);
                matrix.compose(position, quaternion, scale);
                ledStripMesh.setMatrixAt(stripIndex, matrix);
                stripIndex++;

                // LEDライトポイント
                for (let i = 0; i < numLights; i++) {
                    const z = -55 + (i * runwayLength) / numLights;
                    position.set(side * (runwayWidth / 2), 2.5 + offset, z);
                    matrix.compose(position, quaternion, scale);
                    lightMesh.setMatrixAt(lightIndex, matrix);
                    lightIndex++;
                }
            }
        }

        ledStripMesh.instanceMatrix.needsUpdate = true;
        lightMesh.instanceMatrix.needsUpdate = true;
        this.group.add(ledStripMesh);
        this.group.add(lightMesh);

        // アニメーション用に保存
        this.glowingEdges.push({
            mesh: ledStripMesh,
            material: ledMaterial,
            speed: 0.6,
            isInstanced: true
        });
    }

    createCenterStage() {
        // センターステージ（円形）- 金属質で光を反射
        const centerRadius = 8;
        const centerGeometry = new THREE.CylinderGeometry(
            centerRadius,
            centerRadius,
            2.5,
            32
        );
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,  // シルバー色
            roughness: 0.1,   // 滑らかな表面
            metalness: 1.0,   // 完全な金属
            envMapIntensity: 2.0  // 環境マップの強度
        });
        const centerStage = new THREE.Mesh(centerGeometry, centerMaterial);
        centerStage.position.set(0, 1.25, 5);
        centerStage.receiveShadow = true;  // 影を受ける
        this.group.add(centerStage);

        // センターステージのエッジLED - 静止した光
        const centerTexture = this.createGradientTexture();

        // 二重のリング構造で光を強調（アニメーションなし）
        for (let i = 0; i < 2; i++) {
            const centerEdgeGeometry = new THREE.TorusGeometry(
                centerRadius + i * 0.2,
                0.3 + i * 0.1,
                16,
                64
            );
            const centerEdgeMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,  // 蛍光イエロー
                map: centerTexture,
                transparent: true,
                opacity: 0.8 + i * 0.1,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const centerEdge = new THREE.Mesh(centerEdgeGeometry, centerEdgeMaterial);
            centerEdge.position.set(0, 2.6, 5);
            centerEdge.rotation.x = Math.PI / 2;
            this.group.add(centerEdge);
            // glowingEdgesには追加しない（アニメーションさせない）
        }

        // センターステージ周辺のポイントライト（グロー効果強化）
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const light = new THREE.PointLight(0xffff00, 4, 15);
            light.position.set(
                Math.cos(angle) * (centerRadius + 0.5),
                2.6,
                5 + Math.sin(angle) * (centerRadius + 0.5)
            );
            this.group.add(light);
        }

        // センターステージの上昇プラットフォーム効果 - 金属質
        const platformGeometry = new THREE.CylinderGeometry(
            centerRadius - 1,
            centerRadius - 1,
            0.5,
            32
        );
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,  // 明るいシルバー
            roughness: 0.05,  // 非常に滑らか
            metalness: 1.0,   // 完全な金属
            envMapIntensity: 2.5
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 2.75, 5);
        platform.receiveShadow = true;
        this.group.add(platform);
    }

    createStageDecorations() {
        // ステージトラス（構造フレーム）
        const trussMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1
        });

        // 横トラス用InstancedMesh（3本）
        const hTrussGeometry = new THREE.BoxGeometry(65, 1, 1);
        const hTrussMesh = new THREE.InstancedMesh(hTrussGeometry, trussMaterial, 3);

        // 縦トラス用InstancedMesh（5本）
        const vTrussGeometry = new THREE.BoxGeometry(1, 35, 1);
        const vTrussMesh = new THREE.InstancedMesh(vTrussGeometry, trussMaterial, 5);

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        // 横トラスの配置
        for (let i = 0; i < 3; i++) {
            position.set(0, 15 + i * 8, -70);
            matrix.compose(position, quaternion, scale);
            hTrussMesh.setMatrixAt(i, matrix);
        }

        // 縦トラスの配置
        const vTrussPositions = [-30, -15, 0, 15, 30];
        vTrussPositions.forEach((x, i) => {
            position.set(x, 17.5, -70);
            matrix.compose(position, quaternion, scale);
            vTrussMesh.setMatrixAt(i, matrix);
        });

        hTrussMesh.instanceMatrix.needsUpdate = true;
        vTrussMesh.instanceMatrix.needsUpdate = true;
        this.group.add(hTrussMesh);
        this.group.add(vTrussMesh);

        // スピーカースタック（両サイド）
        const speakerMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.7,
            metalness: 0.4
        });

        // スピーカー用InstancedMesh（両サイド4個ずつ = 8個）
        const speakerGeometry = new THREE.BoxGeometry(3, 3, 3);
        const speakerMesh = new THREE.InstancedMesh(speakerGeometry, speakerMaterial, 8);

        // スピーカーグリル用InstancedMesh（8個）
        const grillGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.2);
        const grillMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.8
        });
        const grillMesh = new THREE.InstancedMesh(grillGeometry, grillMaterial, 8);

        let speakerIndex = 0;
        for (let side of [-1, 1]) {
            for (let i = 0; i < 4; i++) {
                // スピーカー
                position.set(side * 35, 3 + i * 3.5, -70);
                matrix.compose(position, quaternion, scale);
                speakerMesh.setMatrixAt(speakerIndex, matrix);

                // グリル
                position.set(side * 35, 3 + i * 3.5, -68.4);
                matrix.compose(position, quaternion, scale);
                grillMesh.setMatrixAt(speakerIndex, matrix);

                speakerIndex++;
            }
        }

        speakerMesh.instanceMatrix.needsUpdate = true;
        grillMesh.instanceMatrix.needsUpdate = true;
        this.group.add(speakerMesh);
        this.group.add(grillMesh);

        // ステージモニター（床置き）
        const monitorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.6
        });

        const monitorPositions = [
            [-20, -70],
            [0, -70],
            [20, -70],
            [-5, -60],
            [5, -60]
        ];

        const monitorGeometry = new THREE.BoxGeometry(2, 1.5, 2);
        const monitorMesh = new THREE.InstancedMesh(
            monitorGeometry,
            monitorMaterial,
            monitorPositions.length
        );

        const rotation = new THREE.Euler(-0.3, 0, 0);
        const monitorQuaternion = new THREE.Quaternion();
        monitorQuaternion.setFromEuler(rotation);

        monitorPositions.forEach(([x, z], i) => {
            position.set(x, 3.75, z);
            matrix.compose(position, monitorQuaternion, scale);
            monitorMesh.setMatrixAt(i, matrix);
        });

        monitorMesh.instanceMatrix.needsUpdate = true;
        this.group.add(monitorMesh);
    }

    // グラデーションテクスチャを生成（光のエフェクト用）
    createGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // 放射状グラデーション
        const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return texture;
    }

    // エッジライトのアニメーション更新
    update(time) {
        // 各エッジのテクスチャーをアニメーション
        this.glowingEdges.forEach((edge) => {
            if (edge.material && edge.material.map) {
                // テクスチャーをスクロールさせて流れる光を表現
                edge.material.map.offset.x = -time * edge.speed * 0.3;
                edge.material.map.offset.y = Math.sin(time * edge.speed) * 0.2;

                // 明滅効果
                const pulse = 0.7 + Math.sin(time * edge.speed * 2) * 0.3;
                edge.material.opacity = pulse;
            }
        });
    }
}
