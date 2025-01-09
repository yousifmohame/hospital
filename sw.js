self.addEventListener('push', event => {
    console.log('Push event received:', event);

    if (event.data) {
        const data = event.data.json(); // Parse the incoming JSON data
        console.log('Push data:', data);

        const title = data.notification?.title || 'Default Title';
        const options = {
            body: data.notification?.body || 'Default Body',
            icon: data.notification?.icon || '/default-icon.png',
            data: {
                click_action: data.notification?.click_action || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } else {
        console.error('No data received in push event.');
    }
});
