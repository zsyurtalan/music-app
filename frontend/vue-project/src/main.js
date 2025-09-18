import { createApp } from 'vue'
import App from './App.vue'
import Keycloak from 'keycloak-js'

console.log('➡️ main.js başlatıldı')

// Keycloak konfigürasyonu
const keycloak = new Keycloak({
  url: "http://localhost:8080/",
  realm: "music-app",
  clientId: "vue-frontend"
});

console.log('🔑 Keycloak konfigürasyonu:', {
  url: "http://localhost:8080/",
  realm: "music-app",
  clientId: "vue-frontend"
})

// Keycloak başlatma
console.log('➡️ Keycloak başlatılıyor...')
keycloak.init({ onLoad: "check-sso", checkLoginIframe: false }).then(authenticated => {
  console.log('✅ Keycloak başlatıldı!')
  console.log('🔐 Authenticated:', authenticated)

  if (authenticated) {
    console.log("✅ Kullanıcı giriş yaptı");
    console.log("Token:", keycloak.token);
    
    // Token'ı localStorage'a kaydet
    if (keycloak.token) {
      localStorage.setItem('keycloak-token', keycloak.token);
      console.log('🔑 Token localStorage\'a kaydedildi:', keycloak.token.substring(0, 50) + '...');
    }
    
    // Login event'ini dispatch et
    window.dispatchEvent(new CustomEvent('keycloak-login'));
  } else {
    console.log("ℹ️ Kullanıcı giriş yapmadı - Misafir modu");
  }

  // Vue uygulamasını başlat
  console.log('➡️ Vue uygulaması başlatılıyor...')
  const app = createApp(App);

  // Keycloak'ı global olarak kullanılabilir yap
  app.config.globalProperties.$keycloak = keycloak;
  window.$keycloak = keycloak; // Global erişim için
  console.log('➡️ Keycloak global olarak ayarlandı')

  app.mount('#app');
  console.log('✅ Vue uygulaması mount edildi!')
}).catch(error => {
  console.error("❌ Keycloak başlatma hatası:", error);
  console.error("❌ Hata detayı:", error.message);
  console.error("❌ Hata stack:", error.stack);

  // Hata durumunda da uygulamayı başlat
  console.log('➡️ Hata durumunda Vue uygulaması başlatılıyor...')
  const app = createApp(App);
  app.mount('#app');
  console.log('✅ Vue uygulaması hata durumunda mount edildi!')
});