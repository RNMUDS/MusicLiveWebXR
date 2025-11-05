import * as THREE from 'three';

export class Stage {
    constructor() {
        this.group = new THREE.Group();
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

        // ステージエッジのLEDライン
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0
        });

        // 前面エッジ
        const frontEdgeGeometry = new THREE.BoxGeometry(60, 0.3, 0.5);
        const frontEdge = new THREE.Mesh(frontEdgeGeometry, edgeMaterial);
        frontEdge.position.set(0, 3.2, -55);
        this.group.add(frontEdge);

        // サイドエッジ
        for (let side of [-1, 1]) {
            const sideEdgeGeometry = new THREE.BoxGeometry(0.5, 0.3, 30);
            const sideEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
            sideEdge.position.set(side * 30, 3.2, -70);
            this.group.add(sideEdge);
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

        // 花道のLEDストリップ（両サイド）
        const ledMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 1.5
        });

        // LEDストリップ用InstancedMesh（2本）
        const ledStripGeometry = new THREE.BoxGeometry(0.3, 0.3, runwayLength);
        const ledStripMesh = new THREE.InstancedMesh(ledStripGeometry, ledMaterial, 2);

        // LEDライトポイント用InstancedMesh（両サイド20個ずつ = 40個）
        const numLights = 20;
        const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMesh = new THREE.InstancedMesh(lightGeometry, ledMaterial, numLights * 2);

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        let lightIndex = 0;
        for (let side of [-1, 1]) {
            // LEDストリップ
            const stripIndex = side === -1 ? 0 : 1;
            position.set(side * (runwayWidth / 2), 2.2, -25);
            matrix.compose(position, quaternion, scale);
            ledStripMesh.setMatrixAt(stripIndex, matrix);

            // LEDライトポイント
            for (let i = 0; i < numLights; i++) {
                const z = -55 + (i * runwayLength) / numLights;
                position.set(side * (runwayWidth / 2), 2.5, z);
                matrix.compose(position, quaternion, scale);
                lightMesh.setMatrixAt(lightIndex, matrix);
                lightIndex++;
            }
        }

        ledStripMesh.instanceMatrix.needsUpdate = true;
        lightMesh.instanceMatrix.needsUpdate = true;
        this.group.add(ledStripMesh);
        this.group.add(lightMesh);
    }

    createCenterStage() {
        // センターステージ（円形）
        const centerRadius = 8;
        const centerGeometry = new THREE.CylinderGeometry(
            centerRadius,
            centerRadius,
            2.5,
            32
        );
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.7
        });
        const centerStage = new THREE.Mesh(centerGeometry, centerMaterial);
        centerStage.position.set(0, 1.25, 5);
        this.group.add(centerStage);

        // センターステージのリング装飾
        const ringGeometry = new THREE.TorusGeometry(centerRadius + 0.5, 0.3, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 1.2
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, 2.6, 5);
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);

        // センターステージの上昇プラットフォーム効果
        const platformGeometry = new THREE.CylinderGeometry(
            centerRadius - 1,
            centerRadius - 1,
            0.5,
            32
        );
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.9
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 2.75, 5);
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
}
