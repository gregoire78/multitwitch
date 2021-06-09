/* eslint-disable no-undef */
const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");

let commitHash = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString();

const config = (env, argv) => ({
  devtool: argv.mode === "production" ? false : "source-map",
  entry: ["./src/index.js"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    chunkFilename: "[id].[chunkhash].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve("babel-loader"),
            options: {
              plugins: [
                argv.mode !== "production" &&
                  require.resolve("react-refresh/babel"),
              ].filter(Boolean),
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        /*vendor: {
            enforce: true,
            test: /[\\/]node_modules[\\/]((?!(antd)).*)[\\/]/,
            name: 'vendor',
            chunks: 'all',
        },
        antd: {
            enforce: true,
            test: /[\\/]node_modules[\\/](antd)[\\/]/,
            name: 'antd',
            chunks: 'all',
        },*/
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
        },
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __COMMIT_HASH__: JSON.stringify(commitHash),
    }),
    new ESLintPlugin({
      extensions: ["js", "jsx"],
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/index.html" },
        {
          from: path.resolve(__dirname, "./src/assets"),
          to: "./assets",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new webpack.EnvironmentPlugin({
      ...process.env,
      NODE_ENV: argv.mode,
    }),
    new Dotenv(),
    new CompressionPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    //new BundleAnalyzerPlugin()
  ],
  devServer: {
    contentBase: "./dist",
  },
});

module.exports = config;
