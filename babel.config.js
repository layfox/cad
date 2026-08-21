
module.exports = {
  env:{
    "development":{
      "sourceMaps":true,
      "retainLines":true, 
    }
  },
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      compact: false
    }]
  ],

  // 设置mxdraw库按需加载
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ],

  ]
}
