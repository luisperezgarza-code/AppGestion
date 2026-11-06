import {
  IonApp,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

function App() {
  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>AppGestion</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <h1>Tu gimnasio, en tu bolsillo</h1>
          <p>
            La app para clientes y entrenadores está lista para empezar a
            construir.
          </p>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default App;
