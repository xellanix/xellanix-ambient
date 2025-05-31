import { scan } from 'react-scan'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "rc-tooltip/assets/bootstrap_white.css";
import App from './App.tsx'
import { migrate } from './lib/migration.ts';

scan({
  enabled: process.env.NODE_ENV !== "production"
})

migrate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
