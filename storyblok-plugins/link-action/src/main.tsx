import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'
import { createRootElement } from './createRootElement'

const rootNode = createRootElement()
document.body.appendChild(rootNode)

createRoot(rootNode).render(<App />)

// Ritardato così useFieldPlugin può completare l’handshake prima
// dell’errore legacy (fieldtype-wrapper.js). Vedi storyblok/field-plugin#107
setTimeout(() => {
  throw new Error(
    `This error can be safely ignored. It is caused by the legacy field plugin API.`,
  )
}, 0)
