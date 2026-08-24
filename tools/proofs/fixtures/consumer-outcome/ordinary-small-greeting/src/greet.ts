const args = process.argv.slice(2);
if (args[0] === "--help" || args[0] === "-h") {
  console.log("Usage: node src/greet.ts");
  process.exit(0);
}
console.log("hello");
