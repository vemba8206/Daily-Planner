import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info("Planora is ready to work offline.");
  },
  onRegisteredSW(_, registration) {
    if (!registration) return;
    window.setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);
  },
});
