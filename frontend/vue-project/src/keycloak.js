import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080/',
  realm: 'music-app',
  clientId: 'vue-frontend'
});

export default keycloak;
