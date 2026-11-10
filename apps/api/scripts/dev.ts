import { spawn } from 'node:child_process'

const build = spawn('bunx', ['nest', 'build'], { stdio: 'inherit' })

build.on('exit', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1)
  }
  const watch = spawn('bunx', ['nest', 'build', '--watch'], { stdio: 'inherit' })
  const server = spawn('bun', ['--watch', 'dist/main.js'], { stdio: 'inherit' })
  const stop = () => {
    watch.kill()
    server.kill()
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  server.on('exit', (status) => {
    watch.kill()
    process.exit(status ?? 0)
  })
})
