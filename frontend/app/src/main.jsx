import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import "./assets/styles/bootswatch.bootstrap.min.css";
// import 'bootstrap/dist/css/bootstrap.min.css';
import "./assets/styles/main.css";

createRoot(document.getElementById('root')).render(
//   <StrictMode>
    <App />
//   </StrictMode>,
)
