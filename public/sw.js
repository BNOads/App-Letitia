// Service Worker para processamento de Notificações Push em Segundo Plano

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || 'Nova notificação no sistema!',
        icon: payload.icon || '/logo.png',
        badge: payload.badge || '/favicon.png',
        data: payload.data || { url: '/' },
        vibrate: [100, 50, 100],
        actions: payload.actions || []
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || 'LaetitiAPP', options)
      );
    } catch (e) {
      // Se não for JSON, exibe o texto puro
      const options = {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/favicon.png',
        data: { url: '/' }
      };
      event.waitUntil(
        self.registration.showNotification('LaetitiAPP', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Abre ou navega para o link da notificação
  const urlToOpen = event.notification.data?.url 
    ? new URL(event.notification.data.url, self.location.origin).href
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Procura se já existe alguma janela aberta com o aplicativo
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
