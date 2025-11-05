import * as THREE from 'three';

export class Stadium {
    constructor() {
        this.group = new THREE.Group();
        this.createStadium();
    }

    createStadium() {
        // 地面（フィールド）
        this.createField();

        // スタンド席（円形に配置）
        this.createStands();

        // 天井構造
        this.createRoof();

        // 壁
        this.createWalls();
    }

    createField() {
        // メインフィールド（楕円形）
        const fieldGeometry = new THREE.CircleGeometry(100, 64);
        const fieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.receiveShadow = true;
        this.group.add(field);

        // フィールドのライン装飾
        const lineGeometry = new THREE.RingGeometry(95, 96, 64);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0x3a3a5c,
            side: THREE.DoubleSide
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0.01;
        this.group.add(line);
    }

    createStands() {
        const standMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a3e,
            roughness: 0.7,
            metalness: 0.3
        });

        // 3層のスタンド席を作成
        for (let layer = 0; layer < 3; layer++) {
            const innerRadius = 105 + layer * 20;
            const outerRadius = innerRadius + 18;
            const height = 15 + layer * 5;
            const yPosition = layer * 15;

            // スタンド本体（セクションごとに分割）
            const sections = 16;
            for (let i = 0; i < sections; i++) {
                const angle = (Math.PI * 2 * i) / sections;
                const nextAngle = (Math.PI * 2 * (i + 1)) / sections;

                // 各セクションの形状
                const shape = new THREE.Shape();
                const steps = 8;

                // 階段状のスタンド
                for (let step = 0; step < steps; step++) {
                    const stepHeight = height / steps;
                    const stepDepth = (outerRadius - innerRadius) / steps;
                    const r1 = innerRadius + step * stepDepth;
                    const r2 = r1 + stepDepth;
                    const y1 = step * stepHeight;
                    const y2 = y1 + stepHeight;

                    // セクションの一部を作成
                    const sectionGeometry = new THREE.BoxGeometry(
                        stepDepth * 0.9,
                        stepHeight,
                        2 * Math.PI * ((r1 + r2) / 2) / sections
                    );
                    const section = new THREE.Mesh(sectionGeometry, standMaterial);

                    const avgRadius = (r1 + r2) / 2;
                    const sectionAngle = (angle + nextAngle) / 2;
                    section.position.x = Math.cos(sectionAngle) * avgRadius;
                    section.position.z = Math.sin(sectionAngle) * avgRadius;
                    section.position.y = yPosition + y1 + stepHeight / 2;
                    section.rotation.y = sectionAngle;

                    this.group.add(section);
                }
            }

            // スタンドの手すり
            const railGeometry = new THREE.TorusGeometry(outerRadius, 0.3, 8, 64);
            const railMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.8,
                roughness: 0.2
            });
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.rotation.x = Math.PI / 2;
            rail.position.y = yPosition + height;
            this.group.add(rail);
        }
    }

    createRoof() {
        // 部分的な天井（コンサート会場風）
        const roofSegments = 8;
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.7,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < roofSegments; i++) {
            const angle = (Math.PI * 2 * i) / roofSegments;
            const roofGeometry = new THREE.BoxGeometry(40, 2, 30);
            const roofPanel = new THREE.Mesh(roofGeometry, roofMaterial);

            const radius = 130;
            roofPanel.position.x = Math.cos(angle) * radius;
            roofPanel.position.z = Math.sin(angle) * radius;
            roofPanel.position.y = 65;
            roofPanel.rotation.y = angle;
            roofPanel.rotation.z = -0.2;

            this.group.add(roofPanel);

            // サポートビーム
            const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 60, 8);
            const beamMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.9,
                roughness: 0.1
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.x = Math.cos(angle) * 140;
            beam.position.z = Math.sin(angle) * 140;
            beam.position.y = 35;
            this.group.add(beam);
        }

        // 中央の照明リグ構造
        const rigGeometry = new THREE.TorusGeometry(30, 1, 8, 32);
        const rigMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.1
        });
        const rig = new THREE.Mesh(rigGeometry, rigMaterial);
        rig.position.y = 55;
        rig.rotation.x = Math.PI / 2;
        this.group.add(rig);
    }

    createWalls() {
        // 外壁（スタジアムの外周）
        const wallGeometry = new THREE.CylinderGeometry(170, 170, 70, 32, 1, true);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f0f1e,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.BackSide
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = 35;
        this.group.add(wall);

        // 外壁の装飾ライン
        const decorGeometry = new THREE.TorusGeometry(170, 0.5, 8, 64);
        const decorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a6a,
            emissive: 0x2a2a4a,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 4; i++) {
            const decor = new THREE.Mesh(decorGeometry, decorMaterial);
            decor.position.y = 15 + i * 15;
            decor.rotation.x = Math.PI / 2;
            this.group.add(decor);
        }
    }
}
