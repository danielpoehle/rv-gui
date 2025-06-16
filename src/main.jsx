import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// BOOTSTRAP IMPORTE HINZUFÜGEN
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// ----------------------------

import { BrowserRouter } from "react-router-dom"; // ROUTER IMPORTIEREN

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* ROUTER HINZUFÜGEN */}
      <App />
    </BrowserRouter> {/* ROUTER HINZUFÜGEN */}
  </React.StrictMode>,
)