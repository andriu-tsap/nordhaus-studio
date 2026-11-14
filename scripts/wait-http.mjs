const url = process.argv[2];
let ready = false;
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(url);
    if (r.ok) {
      ready = true;
      break;
    }
  } catch {
    /* Retry while the service starts. */
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!ready) throw new Error(`HTTP readiness failed: ${url}`);
console.log(`HTTP ready: ${url}`);
