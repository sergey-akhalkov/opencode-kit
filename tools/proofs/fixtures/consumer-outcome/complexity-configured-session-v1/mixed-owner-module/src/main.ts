const effects = [];

function createAccount(id) {
  effects.push(`persist:${id}`);
  effects.push(`notify:${id}`);
}

createAccount("A1");
process.stdout.write(`OK: ${effects.join(",")}\n`);
