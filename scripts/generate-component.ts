#!/usr/bin/env tsx
/**
 * Script per generare componenti React
 * 
 * Questo script:
 * 1. Chiede il tipo di componente (atom/molecule/organism)
 * 2. Chiede il nome del componente
 * 3. Crea la cartella in components/{type}s/{ComponentName}
 * 4. Crea index.tsx con template RAFCE
 * 5. Crea index.module.scss con template base
 * 
 * Uso: npm run generate:component
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Crea interfaccia readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Funzione per chiedere input all'utente
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// Funzione per creare il componente TypeScript
function createComponentTemplate(componentName: string, type: string): string {
  const pascalName = componentName.charAt(0).toUpperCase() + componentName.slice(1)
  
  return `import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const ${pascalName} = () => {
  return (
    <div className={cn('wrapper')}>
    </div>
  )
}

export default ${pascalName}
`
}

// Funzione per creare il file SCSS
function createScssTemplate(componentName: string, type: string): string {
  return `@use "../../../styles" as *;

.wrapper {
}
`
}

async function main() {
  try {
    // Chiedi il tipo di componente
    const type = await askQuestion('Component type (atom/molecule/organism): ')
    
    if (!['atom', 'molecule', 'organism'].includes(type.toLowerCase())) {
      console.error('Invalid component type. Must be: atom, molecule, or organism')
      process.exit(1)
    }

    // Chiedi il nome del componente
    const componentName = await askQuestion('Component name (e.g., MyComponent): ')
    
    if (!componentName) {
      console.error('Component name is required')
      process.exit(1)
    }

    // Normalizza il nome del componente (PascalCase)
    const normalizedName = componentName
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')

    // Crea il percorso della cartella (relativo alla root del progetto)
    // Usa process.cwd() per ottenere la directory di lavoro corrente (root del progetto)
    const projectRoot = process.cwd()
    const componentsDir = path.join(projectRoot, 'components', type.toLowerCase() + 's')
    const componentDir = path.join(componentsDir, normalizedName)

    // Verifica se la cartella esiste già
    if (fs.existsSync(componentDir)) {
      console.error(`Component ${normalizedName} already exists at ${componentDir}`)
      process.exit(1)
    }

    // Crea la cartella
    fs.mkdirSync(componentDir, { recursive: true })
    console.log(`✓ Created directory: ${componentDir}`)

    // Crea index.tsx
    const tsxContent = createComponentTemplate(normalizedName, type.toLowerCase())
    const tsxPath = path.join(componentDir, 'index.tsx')
    fs.writeFileSync(tsxPath, tsxContent)
    console.log(`✓ Created file: ${tsxPath}`)

    // Crea index.module.scss
    const scssContent = createScssTemplate(normalizedName, type.toLowerCase())
    const scssPath = path.join(componentDir, 'index.module.scss')
    fs.writeFileSync(scssPath, scssContent)
    console.log(`✓ Created file: ${scssPath}`)

    console.log(`\n✅ Component ${normalizedName} created successfully!`)
    console.log(`   Location: ${componentDir}`)
    
  } catch (error) {
    console.error('Error creating component:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
