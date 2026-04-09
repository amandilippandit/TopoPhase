export class WebSocketClient {
  constructor(url, onMessage, onConnect, onDisconnect) {
    this.url = url
    this.onMessage = onMessage
    this.onConnect = onConnect
    this.onDisconnect = onDisconnect
    this.ws = null
    this.connected = false
    this.reconnectTimer = null
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)
    } catch (e) {
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.connected = true
      this.retries = 0
      if (this.onConnect) this.onConnect()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (this.onMessage) this.onMessage(data)
      } catch (e) {}
    }

    this.ws.onclose = () => {
      this.connected = false
      if (this.onDisconnect) this.onDisconnect()
      this._scheduleReconnect()
    }

    this.ws.onerror = () => {}
  }

  _scheduleReconnect() {
    this.retries = (this.retries || 0) + 1
    const delay = Math.min(3000 * this.retries, 30000)
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
  }

  reconnect() {
    this.disconnect()
    setTimeout(() => this.connect(), 100)
  }
}
