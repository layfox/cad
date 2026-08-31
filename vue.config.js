const CopyWebpackPlugin = require("copy-webpack-plugin")
const path = require("path")
module.exports = {
  publicPath: './',
  lintOnSave: false,
  // 解决mxcad es6特性可选链报错
  transpileDependencies: ['mxcad', 'mxdraw'],
  // 关闭 TS 类型检查
  chainWebpack: config => {
    config.plugins.delete('fork-ts-checker')
  },
  productionSourceMap: false,
  // 开启多核构建，vue‑cli内置thread‑loader
  parallel: true,
  configureWebpack: {
    // devtool: 'source-map',
    performance: { hints: false }, // mxcad包超大，关闭size警告
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          mxcad: { name: 'chunk-mxcad', test: /[\\/]node_modules[\\/]mxcad/, priority: 20 },
          three: { name: 'chunk-three', test: /[\\/]node_modules[\\/]three/, priority: 20 },
          echarts: { name: 'chunk-echarts', test: /[\\/]node_modules[\\/]echarts/, priority: 10 },
          element: { name: 'chunk-element', test: /[\\/]node_modules[\\/]element-ui/, priority: 10 },
          vendor: { name: 'chunk-vendor', test: /[\\/]node_modules[\\/]/, priority: -10 }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.wasm$/,
          type: 'webassembly/experimental',
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'wasm/[name].[ext]'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin([
        // 拷贝mxcad wasm 相关的核心代码 mxcad默认请求的路径是 /* 所以 需要把文件放dist2d下
        {
          from: "node_modules/mxcad/dist/wasm/2d",
          to: path.resolve(__dirname, "dist/wasm/2d"),
          flatten: true,
          toType: "dir"
        },
        {
          from: "node_modules/mxcad/dist/wasm/2d-st",
          to: path.resolve(__dirname, "dist/wasm/2d-st"),
          flatten: true,
          toType: "dir"
        },
        // 必须要字体文件来显示图纸中的文字，mxcad库默认请求URL路径为 /fonts/* 所以需要放在dist/fonts下
        {
          from: "node_modules/mxcad/dist/fonts",
          to: path.resolve(__dirname, "dist/fonts"),
          flatten: true,
          toType: "dir"
        },
      ])
    ],
  },
  // webpack-dev-server 相关配置
  devServer: {
    open: false,
    disableHostCheck: true,
    port: 8083,
    https: false,
    hotOnly: false,
    before: app => { },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  }
};