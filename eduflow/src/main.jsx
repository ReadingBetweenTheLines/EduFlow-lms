import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // We import the default export as 'App'
import './index.css'
import EduFlowApp from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EduFlowApp /> 
  </React.StrictMode>,
)