const Keycloak = require('keycloak-connect');
const session = require('express-session');

// Keycloak konfigürasyonu
const keycloakConfig = {
  realm: 'music-app',
  'auth-server-url': 'http://localhost:8080/',
  'ssl-required': 'external',
  resource: 'vue-frontend',
  'public-client': true,
  'confidential-port': 0
};

// Session store
const memoryStore = new session.MemoryStore();

// Keycloak instance
const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

module.exports = { keycloak, memoryStore };
