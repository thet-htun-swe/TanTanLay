// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions and supabase/proxies run on servers (Deno), not in the app
    ignores: ['dist/*', 'supabase/functions/*', 'supabase/proxies/*'],
  },
]);
