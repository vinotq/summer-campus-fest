// Cross-tab coordination via BroadcastChannel.
// The tab that mounted PlayPage earliest is the "owner" and can auto-submit.
// Other tabs are passive observers.

const CHANNEL = 'campus-game'
const HEARTBEAT_MS = 600
const DEAD_AFTER_MS = 1800 // if no heartbeat for this long, tab is gone

export function createGameChannel(onBecomePassive, onBecomeActive) {
  const tabId = Math.random().toString(36).slice(2)
  const mountedAt = Date.now()
  let passive = false
  let otherTabSeenAt = 0
  let hbInterval = null
  let checkInterval = null

  const bc = new BroadcastChannel(CHANNEL)

  bc.onmessage = (e) => {
    if (e.data.tabId === tabId) return
    if (e.data.type !== 'hb') return

    otherTabSeenAt = Date.now()

    // If the other tab mounted earlier than us → we're passive
    if (!passive && e.data.mountedAt < mountedAt) {
      passive = true
      onBecomePassive?.()
    }
  }

  hbInterval = setInterval(() => {
    bc.postMessage({ type: 'hb', tabId, mountedAt })
  }, HEARTBEAT_MS)

  // Watch for other tab dying
  checkInterval = setInterval(() => {
    if (passive && Date.now() - otherTabSeenAt > DEAD_AFTER_MS) {
      passive = false
      otherTabSeenAt = 0
      onBecomeActive?.()
    }
  }, HEARTBEAT_MS)

  // Send first heartbeat immediately so new tabs see us fast
  bc.postMessage({ type: 'hb', tabId, mountedAt })

  return {
    isPassive: () => passive,
    destroy: () => {
      clearInterval(hbInterval)
      clearInterval(checkInterval)
      bc.close()
    },
  }
}
