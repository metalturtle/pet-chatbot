export default {
  // Base configuration
  base: "/",

  // Configure server options if needed
  server: {
    port: 5173,
    open: true,
  },

  // Configure build options
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
  },

  // Configure optimizations
  optimizeDeps: {
    include: ["three"],
  },

  // Resolve aliases for import paths
  resolve: {
    alias: {
      "@": "/src",
      "@model": "/@model",
      three: "three",
    },
  },

  // Configure esbuild options
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
};
