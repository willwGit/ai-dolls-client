import { AppConfigEnv } from "@/lib/utils";
import emitter from "@/utils/bus";
import Cookies from "js-cookie";

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
    this.friendId = "";
    this.reconnecting = false;
    this.invalid = false;
    this.timer = null;
  }

  connect(friendId: string) {
    console.log("Connecting to WebSocket with state:", this.socket?.readyState);

    // Ensure token is set before connecting
    const defaultToken =
      "eyJhbGciOiJIUzUxMiJ9.eyJyYW5kb21LZXkiOiJqbnU3OTEiLCJzdWIiOiIxNjQwNTQzOTY0Njc3MzIwNzA2IiwiZXhwIjoxNjgyMzkwMzM1LCJpYXQiOjE2Nzk5NzExMzV9.C58hQ903EPbRN8Xo_Vdrml9lQiiahdR_YVYbWL9osoxRfr9QlZq89mpuy-GnoVkiEEntgLt7XC5-yxHUXlbzVQ";

    if (!Cookies.get("token")) {
      console.log("Setting token before WebSocket connection");
      Cookies.set("token", defaultToken, { expires: 365 });
    }

    if (this.socket?.readyState === 0) return; // Already connecting
    this.friendId = friendId;

    try {
      const wsUrl = `${AppConfigEnv.WSS}restApi/chatMessage/websocket/${friendId}`;
      console.log("WebSocket URL:", wsUrl);

      this.socket = new WebSocket(wsUrl);
      this.socket.addEventListener("open", this.onOpen.bind(this));
      this.socket.addEventListener("error", this.onError.bind(this));
      this.socket.addEventListener("close", this.onClose.bind(this));
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.onError();
    }
  }

  onOpen() {
    console.log("WebSocket connection opened successfully");
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    emitter.emit("hideLoading");

    this.socket?.addEventListener("message", ChatWebSocket.onMessage);

    this.timer = setInterval(() => {
      if (this.socket?.readyState === 1) {
        this.socket.send("PING");
      }
    }, 30000);
  }

  static onMessage(e: unknown) {
    emitter.emit("onSocketMessage", e);
  }

  onError() {
    console.error("WebSocket error occurred");
    if (this.timer) clearInterval(this.timer);
    this.reconnecting = false;
    this.cleanupSocket();
    if (!this.invalid) this.reconnect();
  }

  onClose() {
    console.log("WebSocket connection closed");
    if (this.timer) clearInterval(this.timer);
    this.reconnecting = false;
    this.cleanupSocket();
    if (!this.invalid) this.reconnect();
  }

  cleanupSocket() {
    if (!this.socket) return;

    this.socket?.removeEventListener("open", this.onOpen.bind(this));
    this.socket?.removeEventListener("message", ChatWebSocket.onMessage);
    this.socket?.removeEventListener("error", this.onError.bind(this));
    this.socket?.removeEventListener("close", this.onClose.bind(this));

    try {
      this.socket.close();
    } catch (error) {
      console.error("Error closing socket:", error);
    }

    this.socket = null;
  }

  reconnect(reset = false) {
    console.log(
      "Starting reconnection - attempts:",
      this.reconnectAttempts,
      "reconnecting:",
      this.reconnecting
    );

    if (reset) this.reconnectAttempts = 0;
    if (this.reconnecting) return;
    this.reconnecting = true;

    if (this.reconnectAttempts < MAX_RECONNECT_COUNT) {
      console.log("Reconnection attempt #", this.reconnectAttempts + 1);
      this.reconnectAttempts += 1;

      // Add delay before reconnection
      setTimeout(() => {
        this.connect(this.friendId);
      }, 1000 * this.reconnectAttempts); // Increasing backoff
    } else {
      console.error("Max reconnection attempts reached");
      emitter.emit("sendMsgFail");
    }
  }

  close() {
    console.log("Closing WebSocket connection");
    this.invalid = true;
    this.cleanupSocket();
    if (this.timer) clearInterval(this.timer);
  }

  sendMsg(value: string, type: string) {
    console.log("Sending message, socket state:", this.socket?.readyState);

    if (!this.socket || this.socket.readyState === 0) {
      console.error("Cannot send message: Socket not ready");
      emitter.emit("sendMsgFail");
      return;
    }

    if ([2, 3].includes(this.socket.readyState)) {
      console.error("Cannot send message: Socket closing or closed");
      this.reconnect();
      emitter.emit("sendMsgFail");
      return;
    }

    try {
      this.socket.send(value);
      emitter.emit("sendMsgSuc", type);
    } catch (error) {
      console.error("Error sending message:", error);
      emitter.emit("sendMsgFail");
    }
  }
}

export default ChatWebSocket;
