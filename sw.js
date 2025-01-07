self.addEventListener("push", (event) => {
    console.log("Push event received:", event);
    const notif = event.data ? event.data.json().notification : {};
    const title = notif.title || "Default Title";
    const body = notif.body || "Default Body";
    const icon = notif.image || "/default-icon.png";
    const clickAction = notif.click_action || "/";

    console.log("Notification payload:", notif);

    event.waitUntil(
        self.registration.showNotification(title, {
            body: body,
            icon: icon,
            data: {
                url: clickAction,
            },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    console.log("Notification clicked:", event);
    event.notification.close(); // Close the notification

    const targetUrl = event.notification.data ? event.notification.data.url : null;

    if (!targetUrl) {
        console.warn("No URL found in notification data.");
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
