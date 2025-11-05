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

        for (let side of [-1, 1]) {
            const ledGeometry = new THREE.BoxGeometry(0.3, 0.3, runwayLength);
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(side * (runwayWidth / 2), 2.2, -25);
            this.group.add(led);

            // LEDライトポイント
            const numLights = 20;
            for (let i = 0; i < numLights; i++) {
                const z = -55 + (i * runwayLength) / numLights;
                const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                const light = new THREE.Mesh(lightGeometry, ledMaterial);
                light.position.set(side * (runwayWidth / 2), 2.5, z);
                this.group.add(light);
            }
        }
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

        // 横トラス
        for (let i = 0; i < 3; i++) {
            const trussGeometry = new THREE.BoxGeometry(65, 1, 1);
            const truss = new THREE.Mesh(trussGeometry, trussMaterial);
            truss.position.set(0, 15 + i * 8, -70);
            this.group.add(truss);
        }

        // 縦トラス（サポート）
        for (let x of [-30, -15, 0, 15, 30]) {
            const vTrussGeometry = new THREE.BoxGeometry(1, 35, 1);
            const vTruss = new THREE.Mesh(vTrussGeometry, trussMaterial);
            vTruss.position.set(x, 17.5, -70);
            this.group.add(vTruss);
        }

        // スピーカースタック（両サイド）
        const speakerMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.7,
            metalness: 0.4
        });

        for (let side of [-1, 1]) {
            // メインスピーカー
            for (let i = 0; i < 4; i++) {
                const speakerGeometry = new THREE.BoxGeometry(3, 3, 3);
                const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial);
                speaker.position.set(side * 35, 3 + i * 3.5, -70);
                this.group.add(speaker);

                // スピーカーグリル
                const grillGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.2);
                const grillMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    roughness: 0.8
                });
                const grill = new THREE.Mesh(grillGeometry, grillMaterial);
                grill.position.set(side * 35, 3 + i * 3.5, -68.4);
                this.group.add(grill);
            }
        }

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

        monitorPositions.forEach(([x, z]) => {
            const monitorGeometry = new THREE.BoxGeometry(2, 1.5, 2);
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set(x, 3.75, z);
            monitor.rotation.x = -0.3;
            this.group.add(monitor);
        });
    }
}
