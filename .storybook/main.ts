import type { StorybookConfig } from "@storybook/react-vite"
import path from "path"
const addProxyLogging = (proxy: any) => {
  proxy.on("error", (err, req, res) => {
    console.error("proxy error", err)
  })
  proxy.on("proxyReq", (proxyReq, req, res) => {
    console.log("Sending Request to the Target:", req.method, req.url)
  })
  proxy.on("proxyRes", (proxyRes, req, res) => {
    console.log(
      "Received Response from the Target:",
      proxyRes.statusCode,
      req.url,
    )
  })
}

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite")
    const customViteConfig = {
      plugins: [
        {
          // Story data assets are plain JSON imports, which have no HMR handler
          // of their own: Vite invalidates the importing story and React Fast
          // Refresh accepts the update without re-running the story's module
          // body, so the viewer keeps rendering the previous data. Regenerating
          // one (see core's `watch:prefab-board`) should reload the page.
          name: "reload-on-story-asset-change",
          handleHotUpdate({ file, server }: { file: string; server: any }) {
            if (!file.includes("/stories/assets/") || !file.endsWith(".json")) {
              return
            }
            server.ws.send({ type: "full-reload", path: "*" })
            return []
          },
        },
      ],
      resolve: {
        alias: {
          src: path.resolve(__dirname, "../src"),
        },
      },
      server: {
        headers: {
          "Cross-Origin-Embedder-Policy": "require-corp",
          "Cross-Origin-Opener-Policy": "same-origin",
        },
        proxy: {
          "/easyeda-models": {
            target: "https://modules.easyeda.com/3dmodel/",
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/easyeda-models/, ""),
            configure: addProxyLogging,
          },
          "/easyeda": {
            target: "https://modelcdn.tscircuit.com",
            changeOrigin: true,
            rewrite: (path: string) => {
              const filename = path.split("/").pop()
              return `/easyeda_models/download?pn=${filename}`
            },
            configure: addProxyLogging,
          },
        },
        logLevel: "info",
      },
      optimizeDeps: {
        exclude: ["manifold-3d"],
      },
    }
    return mergeConfig(config, customViteConfig)
  },
  logLevel: "debug",
}
export default config
