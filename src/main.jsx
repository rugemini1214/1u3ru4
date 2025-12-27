import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 如果您沒有 src/index.css 就請把下面這行註解掉或刪掉
// import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)