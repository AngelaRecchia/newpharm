import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'
import { createRootElement } from './createRootElement'

const rootNode = createRootElement()
document.body.appendChild(rootNode)

createRoot(rootNode).render(<App />)

throw new Error(
  `This error can be safely ignored. It is caused by the legacy field plugin API.`,
)
