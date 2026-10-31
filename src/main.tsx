import { createRoot } from 'react-dom/client'
import './index.css'

// Only the chosen entry is bundled; the public demo never starts API/Auth0 clients.
const entry = import.meta.env.MODE === 'standalone'
  ? import('./standalone/StandaloneApp')
  : import('./App')
entry.then(({ default: App }) => createRoot(document.getElementById('root')!).render(<App />))
