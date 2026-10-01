import { startQrisMockServer } from "./helpers/qris-mock-server";

export default async function globalSetup() {
  const server = await startQrisMockServer(9119);
  return async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  };
}
