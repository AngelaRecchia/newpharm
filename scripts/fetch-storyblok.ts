/**
 * Refresh the small Storyblok datasets required before dev/build.
 *
 * These requests are independent, so running them together removes one
 * network round-trip from the critical path.
 */

import { spawn } from 'node:child_process'
import { join } from 'node:path'

function run(script: 'fetch-locales.ts' | 'fetch-filtri.ts'): Promise<void> {
  return new Promise((resolve, reject) => {
    const tsxCli = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs')
    const child = spawn(process.execPath, [tsxCli, join('scripts', script)], {
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${script} exited with code ${code ?? 'unknown'}`))
    })
  })
}

async function main() {
  await Promise.all([run('fetch-locales.ts'), run('fetch-filtri.ts')])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
