import axios from 'axios';

// Instancia configurada para el backend FastAPI, leyendo la URL de Vite .env
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    // Aquí podemos agregar interceptores para tokens JWT en el futuro
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;
 