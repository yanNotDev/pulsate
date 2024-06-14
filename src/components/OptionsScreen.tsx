import React from 'react';
import { IonRange, IonToggle, IonInput, IonList, IonItem, IonCard, IonCardTitle } from '@ionic/react';
import './OptionsScreen.css';

interface OptionsScreenProps {
  vibrationDuration: number;
  latencyOffset: number;
  accentFirstBeat: boolean;
  setVibrationDuration: (value: number) => void;
  setLatencyOffset: (value: number) => void;
  setAccentFirstBeat: (value: boolean) => void;
  vibrationDurationEl: React.RefObject<HTMLIonInputElement>;
  latencyOffsetEl: React.RefObject<HTMLIonInputElement>;
}

const OptionsScreen: React.FC<OptionsScreenProps> = ({
  vibrationDuration,
  latencyOffset,
  accentFirstBeat,
  setVibrationDuration,
  setLatencyOffset,
  setAccentFirstBeat,
  vibrationDurationEl,
  latencyOffsetEl
}) => {
  return (
    <IonList className='main'>

      <IonItem className='settings'>
        <IonList lines='none'>

          <IonItem className='toggle'>
            <IonToggle
              checked={accentFirstBeat}
              enableOnOffLabels={true}
              onIonChange={(e) => setAccentFirstBeat(e.detail.checked)}
              className='accent-toggle'
            >
              Accent First Beat</IonToggle>
          </IonItem>
          <IonItem className="vibration">
            <IonRange
              min={50}
              max={500}
              value={vibrationDuration}
              onIonChange={(e) => setVibrationDuration(e.detail.value as number)}
              pin={true}
              className="vibration-slider"
              label='Vibration Duration (ms)'
              labelPlacement='stacked'
            />
            <IonInput
              value={vibrationDuration}
              onIonChange={(e) => setVibrationDuration(parseInt(e.detail.value as string))}
              type="number"
              class='vibration-input'
              fill='outline'
              ref={vibrationDurationEl}
              min={50}
              max={500}
            />
          </IonItem>
          <IonItem className="latency">
            <IonRange
              min={-1000}
              max={1000}
              value={latencyOffset}
              onIonChange={(e) => setLatencyOffset(e.detail.value as number)}
              pin={true}
              className="latency-slider"
              label='Vibration Delay (ms)'
              labelPlacement='stacked'
            />
            <IonInput
              value={latencyOffset}
              onIonChange={(e) => setLatencyOffset(parseInt(e.detail.value as string))}
              type="number"
              className='latency-input'
              fill='outline'
              ref={latencyOffsetEl}
              min={-1000}
              max={1000}
            />
          </IonItem>

        </IonList>
      </IonItem>

      <IonItem className="about">
        <IonList lines='none'>

          <IonItem>
            <a href="https://github.com/yanNotDev">
              <IonCard>
                <IonCardTitle>Author</IonCardTitle>
                Aayan Faraz
              </IonCard>
            </a>
          </IonItem>
          <IonItem>
            <a href="https://github.com/yanNotDev/pulsate">
              <IonCard>
                <IonCardTitle>Source code</IonCardTitle>
                Github
              </IonCard>
            </a>
          </IonItem>
          <IonItem>
            <IonCard>
              <IonCardTitle>Version</IonCardTitle>
              1.0.0
            </IonCard>
          </IonItem>



        </IonList>
      </IonItem>
    </IonList>
  );
};

export default OptionsScreen;
