import * as Tone from 'tone';

export interface PadState {
  isLoaded: boolean;
  volume: number;
  pitch: number;
  speed: number;
  loop: boolean;
  youtubeId?: string;
  startPercent?: number;
  endPercent?: number;
  distortion: number;
  delay: number;
  reverb: number;
  chokeGroup: number | null;
}

class AudioEngine {
  private players: (Tone.Player | null)[] = Array(16).fill(null);
  private pitchShifters: (Tone.PitchShift | null)[] = Array(16).fill(null);
  private volumes: (Tone.Volume | null)[] = Array(16).fill(null);
  private distortions: (Tone.Distortion | null)[] = Array(16).fill(null);
  private delays: (Tone.FeedbackDelay | null)[] = Array(16).fill(null);
  private reverbs: (Tone.Reverb | null)[] = Array(16).fill(null);
  private metronome: Tone.MembraneSynth | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private masterFilter: Tone.Filter = new Tone.Filter(20000, "lowpass").toDestination();
  public waveform: Tone.Waveform = new Tone.Waveform(512);
  private activeSources: Map<number, Tone.ToneBufferSource[]> = new Map();
  
  private padStates: PadState[] = Array(16).fill(null).map(() => ({
      isLoaded: false, volume: 0, pitch: 0, speed: 1, loop: false, startPercent: 0, endPercent: 100,
      distortion: 0, delay: 0, reverb: 0, chokeGroup: null
  }));
  
  private initialized = false;

  async init() {
    if (!this.initialized) {
      this.initialized = true;
      await Tone.start();
      
      this.masterFilter.connect(this.waveform);
      
      this.metronome = new Tone.MembraneSynth({ volume: -10 }).connect(this.masterFilter);
      this.metronomeLoop = new Tone.Loop((time) => {
        this.metronome?.triggerAttackRelease("C2", "8n", time, 0.5);
      }, "4n");

      Tone.Transport.bpm.value = 120;
      this.initialized = true;
    }
  }

  async toggleTransport(play: boolean) {
    if (!this.initialized) {
      await this.init();
    }
    if (play) {
      Tone.Transport.start();
      this.metronomeLoop?.start(0);
    } else {
      Tone.Transport.stop();
      this.metronomeLoop?.stop();
    }
  }

  setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  async loadSample(padId: number, file: File): Promise<void> {
    await this.init();
    
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      
      if (this.players[padId]) {
        this.players[padId]?.dispose();
        this.pitchShifters[padId]?.dispose();
        this.volumes[padId]?.dispose();
        this.distortions[padId]?.dispose();
        this.delays[padId]?.dispose();
        this.reverbs[padId]?.dispose();
      }

      const volume = new Tone.Volume(0);
      const pitchShift = new Tone.PitchShift(0);
      const dist = new Tone.Distortion(0);
      const delay = new Tone.FeedbackDelay("8n", 0);
      const rev = new Tone.Reverb(2);
      
      // Tone.Reverb generate returns a promise in some versions, but in latest it's fine.
      volume.chain(pitchShift, dist, delay, rev, this.masterFilter);

      const player = new Tone.Player(url, () => {
        resolve();
      }).connect(volume);

      this.players[padId] = player;
      this.pitchShifters[padId] = pitchShift;
      this.volumes[padId] = volume;
      this.distortions[padId] = dist;
      this.delays[padId] = delay;
      this.reverbs[padId] = rev;
    });
  }

  playPad(padId: number, time?: number) {
    if (!this.initialized) this.init();
    
    const player = this.players[padId];
    const volNode = this.volumes[padId];
    if (player && player.loaded && player.buffer && volNode) {
      const startPercent = this.padStates[padId].startPercent || 0;
      const endPercent = this.padStates[padId].endPercent ?? 100;
      const duration = player.buffer.duration;
      
      const offset = (startPercent / 100) * duration;
      const playDur = Math.max(0.01, ((endPercent - startPercent) / 100) * duration);
      
      if (this.padStates[padId].chokeGroup !== null) {
          const group = this.padStates[padId].chokeGroup;
          this.padStates.forEach((state, i) => {
              if (i !== padId && state.chokeGroup === group) {
                  this.stopPad(i);
              }
          });
      }

      if (this.padStates[padId].loop) {
          if (player.state === 'started') {
             player.stop(time);
          }
          player.loop = true;
          player.loopStart = offset;
          player.loopEnd = offset + playDur;
          player.start(time !== undefined ? time : Tone.now(), offset);
      } else {
          player.loop = false;
          const source = new Tone.ToneBufferSource({
              url: player.buffer,
              playbackRate: player.playbackRate,
          }).connect(volNode);
          
          source.onended = () => {
             const list = this.activeSources.get(padId);
             if (list) {
                 this.activeSources.set(padId, list.filter(s => s !== source));
             }
          };
          if (!this.activeSources.has(padId)) this.activeSources.set(padId, []);
          this.activeSources.get(padId)!.push(source);

          source.start(time !== undefined ? time : Tone.now(), offset, playDur);
      }
    }
  }

  getPadSettings(padId: number): PadState {
    return this.padStates[padId];
  }

  updatePadSettings(padId: number, settings: Partial<PadState>) {
    const player = this.players[padId];
    const pitchShift = this.pitchShifters[padId];
    
    Object.assign(this.padStates[padId], settings);

    if (player) {
      if (settings.loop !== undefined) player.loop = settings.loop;
      if (settings.speed !== undefined) player.playbackRate = settings.speed;
    }
    
    const volNode = this.volumes[padId];
    if (volNode && settings.volume !== undefined) volNode.volume.value = settings.volume;
    
    if (pitchShift && settings.pitch !== undefined) pitchShift.pitch = settings.pitch;

    const dist = this.distortions[padId];
    if (dist && settings.distortion !== undefined) dist.distortion = settings.distortion;

    const del = this.delays[padId];
    if (del && settings.delay !== undefined) del.wet.value = settings.delay;

    const rev = this.reverbs[padId];
    if (rev && settings.reverb !== undefined) rev.wet.value = settings.reverb;
  }

  stopPad(padId: number) {
    if (this.players[padId] && this.players[padId]?.state === 'started') {
      this.players[padId]?.stop();
    }
    const sources = this.activeSources.get(padId);
    if (sources) {
        sources.forEach(s => {
           try { s.stop(); } catch(e){}
           s.dispose();
        });
        this.activeSources.set(padId, []);
    }
  }

  clearPad(padId: number) {
    if (this.players[padId]) {
      this.players[padId]?.dispose();
      this.players[padId] = null;
    }
    if (this.pitchShifters[padId]) {
      this.pitchShifters[padId]?.dispose();
      this.pitchShifters[padId] = null;
    }
    if (this.volumes[padId]) {
      this.volumes[padId]?.dispose();
      this.volumes[padId] = null;
    }
    if (this.distortions[padId]) { this.distortions[padId]?.dispose(); this.distortions[padId] = null; }
    if (this.delays[padId]) { this.delays[padId]?.dispose(); this.delays[padId] = null; }
    if (this.reverbs[padId]) { this.reverbs[padId]?.dispose(); this.reverbs[padId] = null; }
    
    this.padStates[padId] = { isLoaded: false, volume: 0, pitch: 0, speed: 1, loop: false, startPercent: 0, endPercent: 100, distortion: 0, delay: 0, reverb: 0, chokeGroup: null };
  }

  setBuffer(padId: number, buffer: Tone.ToneAudioBuffer) {
    if (!this.initialized) this.init();
    
    if (this.players[padId]) {
      this.players[padId]?.dispose();
      this.pitchShifters[padId]?.dispose();
      this.volumes[padId]?.dispose();
      this.distortions[padId]?.dispose();
      this.delays[padId]?.dispose();
      this.reverbs[padId]?.dispose();
    }
    const volume = new Tone.Volume(0);
    const pitchShift = new Tone.PitchShift(0);
    const dist = new Tone.Distortion(0);
    const delay = new Tone.FeedbackDelay("8n", 0);
    const rev = new Tone.Reverb(2);
    
    volume.chain(pitchShift, dist, delay, rev, this.masterFilter);

    const player = new Tone.Player(buffer).connect(volume);
    
    this.players[padId] = player;
    this.pitchShifters[padId] = pitchShift;
    this.volumes[padId] = volume;
    this.distortions[padId] = dist;
    this.delays[padId] = delay;
    this.reverbs[padId] = rev;
    
    this.padStates[padId] = { isLoaded: true, volume: 0, pitch: 0, speed: 1, loop: false, startPercent: 0, endPercent: 100, distortion: 0, delay: 0, reverb: 0, chokeGroup: null };
  }

  copyPad(sourceId: number, targetId: number) {
    const sourcePlayer = this.players[sourceId];
    if (sourcePlayer && sourcePlayer.buffer) {
        if (this.players[targetId]) {
            this.players[targetId]?.dispose();
            this.pitchShifters[targetId]?.dispose();
            this.volumes[targetId]?.dispose();
            this.distortions[targetId]?.dispose();
            this.delays[targetId]?.dispose();
            this.reverbs[targetId]?.dispose();
        }
        
        const volume = new Tone.Volume(this.padStates[sourceId]?.volume || 0);
        const pitchShift = new Tone.PitchShift(this.pitchShifters[sourceId]?.pitch || 0);
        const dist = new Tone.Distortion(this.distortions[sourceId]?.distortion || 0);
        const delay = new Tone.FeedbackDelay("8n", 0);
        delay.wet.value = this.delays[sourceId]?.wet.value || 0;
        const rev = new Tone.Reverb(2);
        rev.wet.value = this.reverbs[sourceId]?.wet.value || 0;
        
        volume.chain(pitchShift, dist, delay, rev, this.masterFilter);

        const newPlayer = new Tone.Player(sourcePlayer.buffer).connect(volume);
        
        this.players[targetId] = newPlayer;
        this.pitchShifters[targetId] = pitchShift;
        this.volumes[targetId] = volume;
        this.distortions[targetId] = dist;
        this.delays[targetId] = delay;
        this.reverbs[targetId] = rev;
        
        this.padStates[targetId] = { ...this.padStates[sourceId] };
        newPlayer.loop = sourcePlayer.loop;
        newPlayer.playbackRate = sourcePlayer.playbackRate;
    } else {
        this.clearPad(targetId);
        this.padStates[targetId] = { ...this.padStates[sourceId] };
    }
  }

  movePad(sourceId: number, targetId: number) {
    // Swap players and states
    const tempPlayer = this.players[targetId];
    this.players[targetId] = this.players[sourceId];
    this.players[sourceId] = tempPlayer;

    const tempPitch = this.pitchShifters[targetId];
    this.pitchShifters[targetId] = this.pitchShifters[sourceId];
    this.pitchShifters[sourceId] = tempPitch;

    const tempVol = this.volumes[targetId];
    this.volumes[targetId] = this.volumes[sourceId];
    this.volumes[sourceId] = tempVol;

    const tempDist = this.distortions[targetId]; this.distortions[targetId] = this.distortions[sourceId]; this.distortions[sourceId] = tempDist;
    const tempDel = this.delays[targetId]; this.delays[targetId] = this.delays[sourceId]; this.delays[sourceId] = tempDel;
    const tempRev = this.reverbs[targetId]; this.reverbs[targetId] = this.reverbs[sourceId]; this.reverbs[sourceId] = tempRev;

    const tempState = this.padStates[targetId];
    this.padStates[targetId] = this.padStates[sourceId];
    this.padStates[sourceId] = tempState;
  }

  stopAll() {
    this.players.forEach((_, i) => {
      this.stopPad(i);
    });
  }

  setMasterFilter(freq: number) {
      if (this.masterFilter) {
          this.masterFilter.frequency.value = freq;
      }
  }
}

export const engine = new AudioEngine();
