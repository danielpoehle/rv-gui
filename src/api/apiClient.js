import axios from 'axios';

// Erstelle eine neue Axios-Instanz mit vordefinierter Konfiguration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Lese die Basis-URL aus der .env-Datei
  headers: {
    'Content-Type': 'application/json',
    // Hier könnten später auch Authentifizierungs-Header hinzukommen
  }
});

export default apiClient;