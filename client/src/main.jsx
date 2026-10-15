import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import './styles/index.css';
import './styles/researcher.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StudyProvider>
          <App />
        </StudyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
