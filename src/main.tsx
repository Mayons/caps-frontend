import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ConfigErrorPage } from './pages/StatusPages';
import { missingConfig } from './config';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{missingConfig.length > 0 ? <ConfigErrorPage /> : <App />}</StrictMode>,
);
