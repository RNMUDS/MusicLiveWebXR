import * as THREE from 'three';

export class AudioSync {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.audioElement = null;
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
        // Web Audio APIのセットアップ
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        // オーディオ要素の作成（デモ用：サイン波）
        this.createDemoAudio();

        console.log('オーディオシステムを初期化しました');
    }

    createDemoAudio() {
        // デモ用のシンセサウンド（実際の音楽ファイルに置き換え可能）
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(0, this.audioContext.currentTime);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    }

    async loadAudioFile(url) {
        try {
            // 音楽ファイルを読み込む
            this.audioElement = new Audio(url);
            this.audioElement.crossOrigin = 'anonymous';

            const source = this.audioContext.createMediaElementSource(
                this.audioElement
            );
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            console.log('音楽ファイルを読み込みました:', url);
        } catch (error) {
            console.error('音楽ファイルの読み込みに失敗:', error);
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
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.audioElement) {
            this.audioElement.play();
        } else {
            // デモサウンドの再生
            this.oscillator.start(0);
            this.playDemoSequence();
        }

        this.isPlaying = true;
        console.log('音楽を再生開始');
    }

    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
        } else {
            this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        }

        this.isPlaying = false;
        console.log('音楽を一時停止');
    }

    playDemoSequence() {
        // デモ用のシンプルなメロディパターン
        if (!this.isPlaying) return;

        const now = this.audioContext.currentTime;
        const notes = [
            { freq: 261.63, time: 0.0, duration: 0.5 },   // C4
            { freq: 293.66, time: 0.5, duration: 0.5 },   // D4
            { freq: 329.63, time: 1.0, duration: 0.5 },   // E4
            { freq: 349.23, time: 1.5, duration: 0.5 },   // F4
            { freq: 392.00, time: 2.0, duration: 1.0 },   // G4
            { freq: 349.23, time: 3.0, duration: 0.5 },   // F4
            { freq: 329.63, time: 3.5, duration: 0.5 },   // E4
            { freq: 293.66, time: 4.0, duration: 1.0 },   // D4
        ];

        const beatTimes = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

        notes.forEach((note) => {
            this.oscillator.frequency.setValueAtTime(
                note.freq,
                now + note.time
            );
            this.gainNode.gain.setValueAtTime(0.3, now + note.time);
            this.gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                now + note.time + note.duration
            );
        });

        // 次のシーケンスをスケジュール
        setTimeout(() => {
            if (this.isPlaying) {
                this.playDemoSequence();
            }
        }, 5000);
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

        if (this.audioElement) {
            this.audioElement.volume = volume;
        } else if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(
                volume * 0.3,
                this.audioContext.currentTime
            );
        }

        console.log('音量を設定:', volume);
    }

    setBeatSensitivity(sensitivity) {
        this.beatThreshold = 1.0 + sensitivity;
        console.log('ビート感度を設定:', sensitivity);
    }
}
