const timestamp = () => new Date().toISOString().split('T')[1].slice(0, 8)

export const logger = {
  info: (msg: string, ...args: any[]) =>
    console.log(`\x1b[36m[${timestamp()}] INFO\x1b[0m  ${msg}`, ...args),
  success: (msg: string, ...args: any[]) =>
    console.log(`\x1b[32m[${timestamp()}] OK  \x1b[0m  ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) =>
    console.log(`\x1b[33m[${timestamp()}] WARN\x1b[0m  ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    console.log(`\x1b[31m[${timestamp()}] ERR \x1b[0m  ${msg}`, ...args),
}
