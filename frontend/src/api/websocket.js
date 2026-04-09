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
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.connected = true
      if (this.onConnect) this.onConnect()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (this.onMessage) this.onMessage(data)
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    this.ws.onclose = () => {
      this.connected = false
      if (this.onDisconnect) this.onDisconnect()
      this.retries = (this.retries || 0) + 1
      const delay = Math.min(3000 * this.retries, 30000)
      this.reconnectTimer = setTimeout(() => this.connect(), delay)
    }

    this.ws.onerror = () => {}
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
