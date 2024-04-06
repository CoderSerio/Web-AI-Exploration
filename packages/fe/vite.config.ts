import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
  },
  css: {
    // css预处理器
    preprocessorOptions: {
      less: {
        // 支持内联 JavaScript
        javascriptEnabled: true, // 一般只需要配置  javascriptEnabled就行，modifyVars也可以稍微配置
        charset: false,
        modifyVars: {
          // 更改主题在这里
          "primary-color": "#52c41a",
          "link-color": "#1DA57A",
          "border-radius-base": "2px",
        },
        // additionalData: '@import "./src/assets/style/global.less";',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 将'@'指向src目录
    },
  },
});
