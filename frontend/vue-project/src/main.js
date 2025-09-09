import { createApp } from 'vue'
import App from './App.vue'
import Keycloak from "keycloak-js";
/*
//Keycloak konfigurasyonu
let keycloak = new Keycloak({
    url: "http://localhost:8080/",
    realm: "music-app",
    clientId: "vue-client",
  });

  //Keycloak başlatma

  keycloak.init({ onLoad: "check-sso",checkLoginIframe: false }).then(authenticated => {
    if (authenticated) {
      console.log("✅ Kullanıcı giriş yaptı");
      console.log("Token:", keycloak.token);
    } else {
      console.log("ℹ️ Kullanıcı giriş yapmadı - Misafir modu");
    }
      
    // Vue uygulamasını başlat
     const app = createApp(App);
    // Keycloak'ı global olarak kullanılabilir yap
    app.config.globalProperties.$keycloak = keycloak;
  
    app.mount('#app');
}).catch(error => {
 console.error("❌ Keycloak başlatma hatası:", error);
   // Hata durumunda da uygulamayı başlat
   const app = createApp(App);
   app.mount('#app');
 });
 */
 const app = createApp(App);
 app.mount('#app');