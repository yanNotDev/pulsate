import { IonContent, IonPage } from '@ionic/react';
import MetronomeComponent from '../components/MetronomeComponent';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className='content'>
        <MetronomeComponent />
      </IonContent>
    </IonPage>
  );
};

export default Home;
