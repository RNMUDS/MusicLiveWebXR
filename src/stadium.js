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

        // 全階段ステップの数を計算
        const layers = 3;
        const sections = 16;
        const steps = 8;
        const totalSteps = layers * sections * steps;

        // InstancedMeshで全ステップを作成
        // 代表的なステップサイズを使用（後でスケールで調整）
        const baseStepGeometry = new THREE.BoxGeometry(1, 1, 1);
        const standsMesh = new THREE.InstancedMesh(
            baseStepGeometry,
            standMaterial,
            totalSteps
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        let instanceIndex = 0;

        // 3層のスタンド席を作成
        for (let layer = 0; layer < layers; layer++) {
            const innerRadius = 105 + layer * 20;
            const outerRadius = innerRadius + 18;
            const height = 15 + layer * 5;
            const yPosition = layer * 15;

            // スタンド本体（セクションごとに分割）
            for (let i = 0; i < sections; i++) {
                const angle = (Math.PI * 2 * i) / sections;
                const nextAngle = (Math.PI * 2 * (i + 1)) / sections;

                // 階段状のスタンド
                for (let step = 0; step < steps; step++) {
                    const stepHeight = height / steps;
                    const stepDepth = (outerRadius - innerRadius) / steps;
                    const r1 = innerRadius + step * stepDepth;
                    const r2 = r1 + stepDepth;
                    const y1 = step * stepHeight;

                    const avgRadius = (r1 + r2) / 2;
                    const sectionAngle = (angle + nextAngle) / 2;

                    // 位置を設定
                    position.x = Math.cos(sectionAngle) * avgRadius;
                    position.z = Math.sin(sectionAngle) * avgRadius;
                    position.y = yPosition + y1 + stepHeight / 2;

                    // 回転を設定
                    rotation.set(0, sectionAngle, 0);
                    quaternion.setFromEuler(rotation);

                    // スケールを設定（各ステップの実際のサイズ）
                    scale.set(
                        stepDepth * 0.9,
                        stepHeight,
                        2 * Math.PI * avgRadius / sections
                    );

                    // マトリックスを合成
                    matrix.compose(position, quaternion, scale);
                    standsMesh.setMatrixAt(instanceIndex, matrix);
                    instanceIndex++;
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

        standsMesh.instanceMatrix.needsUpdate = true;
        this.group.add(standsMesh);
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

        // 屋根パネル用InstancedMesh
        const roofGeometry = new THREE.BoxGeometry(40, 2, 30);
        const roofMesh = new THREE.InstancedMesh(
            roofGeometry,
            roofMaterial,
            roofSegments
        );

        // ビーム用InstancedMesh
        const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 60, 8);
        const beamMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1
        });
        const beamMesh = new THREE.InstancedMesh(
            beamGeometry,
            beamMaterial,
            roofSegments
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        for (let i = 0; i < roofSegments; i++) {
            const angle = (Math.PI * 2 * i) / roofSegments;
            const radius = 130;

            // 屋根パネル
            position.set(
                Math.cos(angle) * radius,
                65,
                Math.sin(angle) * radius
            );
            rotation.set(0, angle, -0.2);
            quaternion.setFromEuler(rotation);
            matrix.compose(position, quaternion, scale);
            roofMesh.setMatrixAt(i, matrix);

            // サポートビーム
            position.set(
                Math.cos(angle) * 140,
                35,
                Math.sin(angle) * 140
            );
            rotation.set(0, 0, 0);
            quaternion.setFromEuler(rotation);
            matrix.compose(position, quaternion, scale);
            beamMesh.setMatrixAt(i, matrix);
        }

        roofMesh.instanceMatrix.needsUpdate = true;
        beamMesh.instanceMatrix.needsUpdate = true;
        this.group.add(roofMesh);
        this.group.add(beamMesh);

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
