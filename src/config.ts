import typia, { type tags } from 'typia';

class Config {
  websocketUrl: string & tags.MinLength<1> = 'ws://localhost:17280/ws';
}

function loadConfig(): Config {
  const config = new Config();

  const url = process.env.XMAGE_WEBSOCKET_URL;
  if (url !== undefined) config.websocketUrl = url;

  return typia.assert<Config>(config);
}

export type { Config };
export const config = loadConfig();
