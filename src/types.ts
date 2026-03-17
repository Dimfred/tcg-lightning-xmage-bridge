export interface XmageMessage {
  type: string;
  payload?: unknown;
}

export interface CallbackPayload<T = unknown> {
  method: string;
  messageId: number;
  objectId?: string;
  data?: T;
}

export interface DisconnectInfo {
  code: number;
  reason: string;
}

export interface ServerError {
  error: string;
}

export interface ServerMessage {
  message: string;
}
