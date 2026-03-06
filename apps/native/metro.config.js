const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const SERVER_ONLY_PACKAGES = [
  "@XoGordura/db",
  "@XoGordura/auth",
  "@neondatabase/serverless",
  "better-auth",
  "drizzle-orm",
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isServerOnly = SERVER_ONLY_PACKAGES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/"),
  );
  if (isServerOnly) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

const uniwindConfig = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});

module.exports = uniwindConfig;
