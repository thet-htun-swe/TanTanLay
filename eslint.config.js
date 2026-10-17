// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions runs on Supabase (Deno), not in the app
    ignores: ['dist/*', 'supabase/functions/*'],
  },
]);
