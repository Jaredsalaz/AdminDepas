import axios from 'axios';

// Instancia configurada para el backend FastAPI corriendo en el puerto 5000
const api = axios.create({
    baseURL: 'http://127.0.0.1:5000/api',
    // Aquí podemos agregar interceptores para tokens JWT en el futuro
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;
