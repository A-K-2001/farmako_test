import { CONFIG } from '../lib/config';
import { server } from '../server';

// Add error listeners

async function main() {
  await server.listen(CONFIG.PORT);
}

main();
