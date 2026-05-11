const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\.local\/.*/,
  /\.git\/.*/,
  /mnt\/.*/,
];

const rnwPath = path.resolve(__dirname, "node_modules/react-native-web");

// Native-only packages that must be stubbed on web
const WEB_STUBS = new Set([
  "@stripe/stripe-react-native",
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" || platform === "node") {
    // Stub native-only packages completely on web
    if (WEB_STUBS.has(moduleName)) {
      return { type: "empty" };
    }

    // Redirect top-level `react-native` import to react-native-web
    if (moduleName === "react-native") {
      return context.resolveRequest(context, "react-native-web", platform);
    }

    // Redirect react-native subpath imports (e.g. react-native/Libraries/...)
    // Try react-native-web equivalent first; if absent, use an empty stub
    // so native internals are never bundled on web.
    if (moduleName.startsWith("react-native/")) {
      const subPath = moduleName.slice("react-native/".length);
      const rnwEquiv = path.join(rnwPath, subPath);
      try {
        return context.resolveRequest(context, rnwEquiv, platform);
      } catch {
        return { type: "empty" };
      }
    }

    // For relative imports originating FROM inside react-native/Libraries/,
    // try normal resolution; if it fails (e.g. missing .web.js shim),
    // return an empty stub so the native-only file is silently skipped.
    if (
      context.originModulePath.includes("/node_modules/react-native/Libraries/") &&
      !context.originModulePath.includes("/node_modules/react-native-web/")
    ) {
      try {
        return context.resolveRequest(context, moduleName, platform);
      } catch {
        return { type: "empty" };
      }
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
