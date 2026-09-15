import { createRoot } from 'react-dom/client'
import App from './App'
import { createRootElement } from './createRootElement'

const root = createRootElement()
document.body.appendChild(root)
createRoot(root).render(<App />)

throw new Error('This error can be safely ignored. It is caused by the legacy field plugin API.')
