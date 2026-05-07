self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Solo Leveling'
  const options = {
    body: data.body || 'Você tem quests pendentes!',
    icon: '/icons/icon-sl.png',
    badge: '/icons/icon-sl.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})