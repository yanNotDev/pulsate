import React, { useEffect, useState, useRef } from 'react';
import { Haptics } from '@capacitor/haptics';
import { IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonRange, IonInput, RangeChangeEventDetail, InputChangeEventDetail } from '@ionic/react';
import { pause, play, settingsSharp, add, remove } from 'ionicons/icons';
import './MetronomeComponent.css';
import OptionsScreen from './OptionsScreen';
import { App } from '@capacitor/app';


interface ContainerProps { }

class AudioMetronome {
  audioContext: AudioContext | null;
  notesInQueue: any[];
  currentBeatInBar: number;
  beatsPerBar: number;
  tempo: number;
  lookahead: number;
  scheduleAheadTime: number;
  nextNoteTime: number;
  isRunning: boolean;
  intervalID: NodeJS.Timeout | null;
  accentFirstBeat: boolean;

  constructor(tempo = 120, beatsPerBar = 4, accentFirstBeat = true) {
    this.audioContext = null;
    this.notesInQueue = [];
    this.currentBeatInBar = 0;
    this.beatsPerBar = beatsPerBar;
    this.tempo = tempo;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = 0.0;
    this.isRunning = false;
    this.intervalID = null;
    this.accentFirstBeat = accentFirstBeat;
  }

  nextNote() {
    var secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeatInBar++;
    if (this.currentBeatInBar === this.beatsPerBar) {
      this.currentBeatInBar = 0;
    }
  }

  scheduleNote(beatNumber: number, time: number) {
    this.notesInQueue.push({ note: beatNumber, time: time });

    const osc = this.audioContext!.createOscillator();
    const envelope = this.audioContext!.createGain();

    osc.frequency.value = (beatNumber % this.beatsPerBar === 0 && this.accentFirstBeat) ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.connect(envelope);
    envelope.connect(this.audioContext!.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  scheduler() {
    while (this.nextNoteTime < this.audioContext!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeatInBar, this.nextNoteTime);
      this.nextNote();
    }
  }

  start() {
    if (this.isRunning) return;

    if (this.audioContext === null) {
      this.audioContext = new (window.AudioContext)();
    }

    this.isRunning = true;
    this.currentBeatInBar = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;

    this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isRunning = false;

    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }

  startStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  updateTempo(newTempo: number) {
    this.tempo = newTempo;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  updateBeatsPerBar(newBeatsPerBar: number) {
    this.beatsPerBar = newBeatsPerBar;
    this.currentBeatInBar = 0;
  }

  updateAccentFirstBeat(newAccentFirstBeat: boolean) {
    this.accentFirstBeat = newAccentFirstBeat;
  }
}

class HapticMetronome {
  currentBeatInBar: number;
  beatsPerBar: number;
  tempo: number;
  isRunning: boolean;
  intervalID: NodeJS.Timeout | null;
  vibrationDuration: number;
  accentFirstBeat: boolean;

  constructor(tempo = 120, vibrationDuration = 50, beatsPerBar = 4, accentFirstBeat = true) {
    this.currentBeatInBar = 0;
    this.beatsPerBar = beatsPerBar;
    this.tempo = tempo;
    this.isRunning = false;
    this.intervalID = null;
    this.vibrationDuration = vibrationDuration;
    this.accentFirstBeat = accentFirstBeat;
  }

  nextNote() {
    this.currentBeatInBar++;
    if (this.currentBeatInBar === this.beatsPerBar) {
      this.currentBeatInBar = 0;
    }
  }

  scheduleNote() {
    const beatNumber = this.currentBeatInBar;
    if (beatNumber % this.beatsPerBar === 0 && this.accentFirstBeat) {
      Haptics.vibrate({ duration: this.vibrationDuration * 2 });
    } else {
      Haptics.vibrate({ duration: this.vibrationDuration });
    }
    this.nextNote();
  }

  scheduler() {
    const interval = (60 / this.tempo) * 1000;
    this.scheduleNote();
    this.intervalID = setTimeout(() => this.scheduler(), interval);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentBeatInBar = 0;
    this.scheduler();
  }

  stop() {
    this.isRunning = false;

    if (this.intervalID) {
      clearTimeout(this.intervalID);
      this.intervalID = null;
    }
  }

  startStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  updateTempo(newTempo: number) {
    this.tempo = newTempo;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  updateVibrationDuration(newDuration: number) {
    this.vibrationDuration = newDuration;
  }

  updateBeatsPerBar(newBeatsPerBar: number) {
    this.beatsPerBar = newBeatsPerBar;
    this.currentBeatInBar = 0;
  }

  updateAccentFirstBeat(newAccentFirstBeat: boolean) {
    this.accentFirstBeat = newAccentFirstBeat;
  }
}

const MetronomeComponent: React.FC<ContainerProps> = () => {
  const [tempo, setTempo] = useState(120);
  const tempoEl = useRef<HTMLIonInputElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const beatsPerBarEl = useRef<HTMLIonInputElement>(null);
  const [vibrationDuration, setVibrationDuration] = useState(120);
  const vibrationDurationEl = useRef<HTMLIonInputElement>(null);
  const [latencyOffset, setLatencyOffset] = useState(0);
  const latencyOffsetEl = useRef<HTMLIonInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const audioMetronomeRef = useRef<AudioMetronome | null>(null);
  const hapticMetronomeRef = useRef<HapticMetronome | null>(null);

  const MIN_TEMPO = 40;
  const MAX_TEMPO = 240;

  useEffect(() => {
    audioMetronomeRef.current = new AudioMetronome(tempo, beatsPerBar, accentFirstBeat);
    hapticMetronomeRef.current = new HapticMetronome(tempo, vibrationDuration, beatsPerBar, accentFirstBeat);
  }, []);

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'background' && isRunning) {
        if (audioMetronomeRef.current) audioMetronomeRef.current.stop();
        if (hapticMetronomeRef.current) hapticMetronomeRef.current.stop();
        setIsRunning(false);
      }
    };

    App.addListener('appStateChange', ({ isActive }) => {
      handleAppStateChange(isActive ? 'active' : 'background');
    });

    return () => {
      App.removeAllListeners();
    };
  }, [isRunning]);

  const handlePlayPauseClick = () => {
    if (audioMetronomeRef.current && hapticMetronomeRef.current) {
      if (latencyOffset > 0) {
        // Start audio metronome first, then haptic metronome after latencyOffset
        audioMetronomeRef.current.startStop();
        setTimeout(() => {
          hapticMetronomeRef.current!.startStop();
        }, latencyOffset);
      } else if (latencyOffset < 0) {
        // Start haptic metronome first, then audio metronome after |latencyOffset|
        hapticMetronomeRef.current.startStop();
        setTimeout(() => {
          audioMetronomeRef.current!.startStop();
        }, -latencyOffset);
      } else {
        // Start both metronomes at the exact same time
        audioMetronomeRef.current.startStop();
        hapticMetronomeRef.current.startStop();
      }
      setIsRunning(!isRunning);
    }
  };

  const handleTempoChange = (newTempo: number, change: number) => {
    if (audioMetronomeRef.current && hapticMetronomeRef.current) {
      if (isNaN(newTempo)) {
        tempoEl.current!.value = tempo.toString();
      } else {
        newTempo = newTempo + change;
        if (newTempo < MIN_TEMPO) {
          newTempo = MIN_TEMPO;
        } else if (newTempo > MAX_TEMPO) {
          newTempo = MAX_TEMPO;
        }
        audioMetronomeRef.current.updateTempo(newTempo);
        hapticMetronomeRef.current.updateTempo(newTempo);
        setTempo(newTempo);
      }
    }
  };

  const handleVibrationDurationChange = (newDuration: number) => {
    if (isNaN(newDuration) || newDuration < 50 || newDuration > 500) {
      vibrationDurationEl.current!.value = vibrationDuration.toString();
    } else {
      if (hapticMetronomeRef.current) {
        setVibrationDuration(newDuration);
        hapticMetronomeRef.current.updateVibrationDuration(newDuration);
      }
    }
  };

  const handleLatencyOffsetChange = (newOffset: number) => {
    if (isNaN(newOffset) || newOffset < -1000 || newOffset > 1000) {
      latencyOffsetEl.current!.value = latencyOffset.toString();
    } else {
      setLatencyOffset(newOffset);
    }
  };

  const handleBeatsPerBarChange = (newBeatsPerBar: number) => {
    if (isNaN(newBeatsPerBar) || newBeatsPerBar < 1 || newBeatsPerBar > 8) {
      beatsPerBarEl.current!.value = beatsPerBar.toString();
    } else {
      setBeatsPerBar(newBeatsPerBar);
      if (audioMetronomeRef.current && hapticMetronomeRef.current) {
        audioMetronomeRef.current.updateBeatsPerBar(newBeatsPerBar);
        hapticMetronomeRef.current.updateBeatsPerBar(newBeatsPerBar);
      }
    }
  };

  const handleAccentFirstBeatChange = (newAccentFirstBeat: boolean) => {
    setAccentFirstBeat(newAccentFirstBeat);
    if (audioMetronomeRef.current && hapticMetronomeRef.current) {
      audioMetronomeRef.current.updateAccentFirstBeat(newAccentFirstBeat);
      hapticMetronomeRef.current.updateAccentFirstBeat(newAccentFirstBeat);
    }
  };

  const handleSettingsClick = () => {
    if (audioMetronomeRef.current && hapticMetronomeRef.current) {
      audioMetronomeRef.current.stop();
      hapticMetronomeRef.current.stop();
      setIsRunning(false);
    }
    setIsSettingsOpen(true);
  };


  return (
    <main>
      <IonIcon id='settings' aria-label='Settings' onClick={handleSettingsClick} icon={settingsSharp} />

      <div className="tempo-buttons">
        <IonButton shape='round' size='small' onClick={() => handleTempoChange(tempo, -1)}>
          <IonIcon icon={remove} />
        </IonButton>
        <IonButton shape='round' size='large' id="play-button" onClick={handlePlayPauseClick}>
          <IonIcon icon={isRunning ? pause : play} />
        </IonButton>
        <IonButton shape='round' size='small' onClick={() => handleTempoChange(tempo, 1)}>
          <IonIcon icon={add} />
        </IonButton>
      </div>

      <div className="tempo">
        <IonRange
          label='BPM'
          labelPlacement='stacked'
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempo}
          onIonChange={(e) => handleTempoChange(e.detail.value as number, 0)}
          pin={true}
          className='range'
        />
        <IonInput
          value={tempo}
          onIonChange={(e) => handleTempoChange(parseInt(e.detail.value as string), 0)}
          type="number"
          ref={tempoEl}
          fill='outline'
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          className='input'
        />
      </div>

      <div className="beats">
        <IonRange
          label='Beats'
          labelPlacement='stacked'
          min={1}
          max={8}
          step={1}
          value={beatsPerBar}
          onIonChange={(e) => handleBeatsPerBarChange(e.detail.value as number)}
          ticks={true}
          snaps={true}
          pin={true}
          className='range'
        />
        <IonInput
          value={beatsPerBar}
          onIonChange={(e) => handleBeatsPerBarChange(parseInt(e.detail.value as string))}
          ref={beatsPerBarEl}
          type="number"
          fill='outline'
          min={1}
          max={8}
          className='input'
        />
      </div>

      <IonModal isOpen={isSettingsOpen} onDidDismiss={() => setIsSettingsOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsSettingsOpen(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <OptionsScreen
            vibrationDuration={vibrationDuration}
            latencyOffset={latencyOffset}
            accentFirstBeat={accentFirstBeat}
            setVibrationDuration={handleVibrationDurationChange}
            setLatencyOffset={handleLatencyOffsetChange}
            setAccentFirstBeat={handleAccentFirstBeatChange}
            vibrationDurationEl={vibrationDurationEl}
            latencyOffsetEl={latencyOffsetEl}
          />
        </IonContent>
      </IonModal>
    </main>
  );
};

export default MetronomeComponent;
