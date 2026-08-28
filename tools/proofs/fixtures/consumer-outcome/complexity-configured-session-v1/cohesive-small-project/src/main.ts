export function greeting(name) {
  return `Hello, ${name}!`;
}

process.stdout.write(`OK: ${greeting("reader")}\n`);
