import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // We import the default export as 'App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* We render 'App', not 'EduFlowApp' */}
  </React.StrictMode>,
)