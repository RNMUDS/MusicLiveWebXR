import * as THREE from 'three';

export class AudioSync {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.audioElement = null;
        this.positionalAudio = null;
        this.audioListener = null;
        this.isPlaying = false;
        this.beat = 0;
        this.bass = 0;
        this.mid = 0;
        this.treble = 0;
        this.volume = 0;
        this.beatThreshold = 1.3;
        this.beatDecay = 0.98;
        this.lastBeatTime = 0;
        this.beatHistory = [];
    }

    async init() {
        // AudioListenerを作成してカメラに追加
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        // Web Audio APIのセットアップ
        this.audioContext = this.audioListener.context;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log('オーディオシステムを初期化しました（3D空間音響対応）');
    }

    createSpeakerObjects() {
        // ステージにスピーカーを配置（視覚的表現）
        const speakerGeometry = new THREE.BoxGeometry(2, 3, 1.5);
        const speakerMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.2,
        });

        // 左右のメインスピーカー
        const positions = [
            { x: -15, y: 5, z: -65 },  // 左
            { x: 15, y: 5, z: -65 },   // 右
            { x: -10, y: 3, z: -68 },  // 左内側
            { x: 10, y: 3, z: -68 },   // 右内側
        ];

        positions.forEach((pos) => {
            const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial);
            speaker.position.set(pos.x, pos.y, pos.z);
            this.scene.add(speaker);

            // スピーカーグリル（メッシュ）
            const grillGeometry = new THREE.PlaneGeometry(1.5, 2.5);
            const grillMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.5,
                roughness: 0.8,
            });
            const grill = new THREE.Mesh(grillGeometry, grillMaterial);
            grill.position.set(pos.x, pos.y, pos.z + 0.76);
            this.scene.add(grill);
        });

        console.log('スピーカーオブジェクトを配置しました');
    }

    async loadAudioFile(url) {
        try {
            console.log('🎵 音楽ファイルの読み込みを開始:', url);

            // PositionalAudioを作成（ステージ中央に配置）
            this.positionalAudio = new THREE.PositionalAudio(this.audioListener);

            // オーディオローダーで音楽ファイルを読み込む
            const audioLoader = new THREE.AudioLoader();
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load(
                    url,
                    (audioBuffer) => {
                        console.log('✅ オーディオバッファを取得しました');
                        resolve(audioBuffer);
                    },
                    (progress) => {
                        if (progress.lengthComputable) {
                            const percent = Math.round((progress.loaded / progress.total) * 100);
                            console.log('Loading audio:', percent + '%');
                        }
                    },
                    (error) => {
                        console.error('❌ AudioLoader error:', error);
                        reject(error);
                    }
                );
            });

            console.log('🎵 オーディオバッファを設定中...');
            this.positionalAudio.setBuffer(buffer);
            this.positionalAudio.setRefDistance(20); // 基準距離
            this.positionalAudio.setMaxDistance(300); // 最大距離
            this.positionalAudio.setRolloffFactor(1); // 距離減衰率
            this.positionalAudio.setVolume(1.0); // 音量
            this.positionalAudio.setLoop(false); // ループなし（1回再生）

            // 音源をステージ中央に配置
            this.soundSource = new THREE.Object3D();
            this.soundSource.position.set(0, 5, -65); // ステージ中央
            this.scene.add(this.soundSource);
            this.soundSource.add(this.positionalAudio);

            console.log('🔗 アナライザーに接続中...');
            // アナライザーに接続（周波数解析用）
            this.positionalAudio.getOutput().connect(this.analyser);

            // スピーカーオブジェクトを配置
            this.createSpeakerObjects();

            console.log('✅ 音楽ファイルを読み込みました（3D空間音響）:', url);
            console.log('📊 Audio duration:', buffer.duration, 'seconds');
            console.log('📍 音源位置: (0, 5, -65) ステージ中央');
            console.log('🎧 AudioListener context state:', this.audioListener.context.state);
        } catch (error) {
            console.error('❌ 音楽ファイルの読み込みに失敗:', error);
            console.error('URL:', url);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            console.log('🎵 再生開始...');
            console.log('AudioContext state:', this.audioContext.state);
            console.log('PositionalAudio exists:', !!this.positionalAudio);
            console.log('Buffer exists:', !!this.positionalAudio?.buffer);

            // AudioContextが停止している場合は再開
            if (this.audioContext.state === 'suspended') {
                console.log('⏸️ AudioContextが停止中です。再開します...');
                await this.audioContext.resume();
                console.log('▶️ AudioContext state after resume:', this.audioContext.state);
            }

            // オーディオバッファが読み込まれているか確認
            if (!this.positionalAudio) {
                console.error('❌ PositionalAudioが初期化されていません');
                return;
            }

            if (!this.positionalAudio.buffer) {
                console.error('❌ オーディオバッファが読み込まれていません');
                console.error('loadAudioFile()を先に呼び出してください');
                return;
            }

            console.log('🎧 3D空間音響で音楽を再生します');
            console.log('📍 音源位置: ステージ中央 (0, 5, -65)');
            console.log('⏱️ Audio duration:', this.positionalAudio.buffer.duration, 'seconds');
            console.log('🔊 Volume:', this.positionalAudio.getVolume());
            console.log('📏 RefDistance:', this.positionalAudio.getRefDistance());

            // 再生開始
            this.positionalAudio.play();
            this.isPlaying = true;

            console.log('✅ 音楽の再生を開始しました（3D空間音響）');
            console.log('🎼 isPlaying:', this.positionalAudio.isPlaying);
        } catch (error) {
            console.error('❌ 再生エラー:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }

    pause() {
        if (this.positionalAudio && this.positionalAudio.isPlaying) {
            this.positionalAudio.pause();
        }

        this.isPlaying = false;
        console.log('音楽を一時停止');
    }

    getAudioData() {
        if (!this.analyser) {
            return {
                beat: 0,
                bass: 0,
                mid: 0,
                treble: 0,
                volume: 0,
            };
        }

        // 周波数データを取得
        this.analyser.getByteFrequencyData(this.dataArray);

        // 周波数帯域ごとの分析
        const bassRange = this.getAverageFrequency(0, 10);          // 低音
        const midRange = this.getAverageFrequency(10, 60);          // 中音
        const trebleRange = this.getAverageFrequency(60, 150);      // 高音

        // 全体の音量
        const totalVolume = this.getAverageFrequency(0, this.bufferLength);

        // ビート検出（低音の急激な変化）
        this.detectBeat(bassRange);

        // 正規化（0-1の範囲）
        this.bass = bassRange / 255;
        this.mid = midRange / 255;
        this.treble = trebleRange / 255;
        this.volume = totalVolume / 255;

        return {
            beat: this.beat,
            bass: this.bass,
            mid: this.mid,
            treble: this.treble,
            volume: this.volume,
        };
    }

    getAverageFrequency(startIndex, endIndex) {
        let sum = 0;
        const range = endIndex - startIndex;

        for (let i = startIndex; i < endIndex && i < this.bufferLength; i++) {
            sum += this.dataArray[i];
        }

        return sum / range;
    }

    detectBeat(currentBass) {
        const now = performance.now();

        // ビート履歴に追加
        this.beatHistory.push(currentBass);
        if (this.beatHistory.length > 10) {
            this.beatHistory.shift();
        }

        // 平均値を計算
        const average =
            this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;

        // 閾値を超えたらビート検出
        if (
            currentBass > average * this.beatThreshold &&
            now - this.lastBeatTime > 200
        ) {
            this.beat = 1.0;
            this.lastBeatTime = now;
        } else {
            // ビート強度を減衰
            this.beat *= this.beatDecay;
        }
    }

    // 周波数スペクトラムの取得（ビジュアライザー用）
    getFrequencyData() {
        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.dataArray);
        return Array.from(this.dataArray);
    }

    // 波形データの取得
    getWaveformData() {
        if (!this.analyser) return null;

        const waveformData = new Uint8Array(this.bufferLength);
        this.analyser.getByteTimeDomainData(waveformData);
        return Array.from(waveformData);
    }

    setVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));

        if (this.positionalAudio) {
            this.positionalAudio.setVolume(volume);
        }

        console.log('音量を設定:', volume);
    }

    setBeatSensitivity(sensitivity) {
        this.beatThreshold = 1.0 + sensitivity;
        console.log('ビート感度を設定:', sensitivity);
    }
}
