import { AppConfigEnv } from '@/lib/utils';
import emitter from '@/utils/bus';

const MAX_RECONNECT_COUNT = 5;

class ChatWebSocket {
  socket: WebSocket | null;
  reconnectAttempts: number;
  friendId: string;
  reconnecting: boolean;
  invalid: boolean;
  timer: NodeJS.Timeout | null;

  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.friendId = '';
    this.reconnecting = false;
    this.invalid = false;
    this.timer = null;
  }

  connect(friendId: string) {
    console.log(this.socket?.readyState);

    if (this.socket?.readyState === 0) return;
    this.friendId = friendId;
    this.socket = new WebSocket(
      `${AppConfigEnv.WSS}restApi/chatMessage/websocket/${friendId}`
    );
    this.socket.addEventListener('open', this.onOpen.bind(this));
    this.socket.addEventListener('error', this.onError.bind(this));
    this.socket.addEventListener('close', this.onError.bind(this));
  }

  onOpen() {
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    emitter.emit('hideLoading');

    this.socket?.addEventListener('message', ChatWebSocket.onMessage);

    this.timer = setInterval(() => {
      this.socket?.send('PING');
    }, 30000);
  }

  static onMessage(e: unknown) {
    emitter.emit('onSocketMessage', e);
  }

  onError() {
    if (this.timer) clearInterval(this.timer);
    this.reconnecting = false;
    this.socket?.close();
    this.socket?.removeEventListener('open', this.onOpen.bind(this));
    this.socket?.removeEventListener('message', ChatWebSocket.onMessage);
    this.socket?.removeEventListener('error', this.onError.bind(this));
    this.socket?.removeEventListener('close', this.onError.bind(this));
    if (!this.invalid) this.reconnect();
  }

  reconnect(reset = false) {
    console.log(
      '开始重连 reconnectAttempts ',
      this.reconnectAttempts,
      'reconnecting ',
      this.reconnecting
    );

    if (reset) this.reconnectAttempts = 0;
    if (this.reconnecting) return;
    this.reconnecting = true;
    if (this.reconnectAttempts < MAX_RECONNECT_COUNT) {
      console.log('重连 + ', this.reconnectAttempts);

      this.reconnectAttempts += 1;
      this.connect(this.friendId);
    }
  }

  close() {
    this.socket?.removeEventListener('open', this.onOpen.bind(this));
    this.socket?.removeEventListener('message', ChatWebSocket.onMessage);
    this.socket?.removeEventListener('error', this.onError.bind(this));
    this.socket?.removeEventListener('close', this.onError.bind(this));
    this.invalid = true;
    this.socket?.close();
    if (this.timer) clearInterval(this.timer);
  }

  sendMsg(value: string, type: string) {
    console.log(this.socket?.readyState);

    if (!this.socket || this.socket.readyState === 0) {
      emitter.emit('sendMsgFail');
      return;
    }

    if ([2, 3].includes(this.socket.readyState)) {
      this.reconnect();
      emitter.emit('sendMsgFail');
      return;
    }

    this.socket.send(value);
    emitter.emit('sendMsgSuc', type);
  }
}

export default ChatWebSocket;
