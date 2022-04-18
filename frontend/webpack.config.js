var path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: "./index.ts",
  output: {
    path: path.resolve(
      __dirname,
      "../netbox_vault_secrets/static/netbox_vault_secrets/"
    ),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devServer: {
    port: 8083,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "content-type",
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
