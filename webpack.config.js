/* eslint-disable no-undef */
const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

let commitHash = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

const config = (env, argv) => ({
  devtool: argv.mode === "production" ? false : "source-map",
  entry: {
    main: "./src/index.js",
    //grid: "./src/components/gridLayout.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].bundle.js",
    chunkFilename: "[id].[chunkhash].js",
    clean: true,
    publicPath: "/",
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
      chunks: "all",
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
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
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5000000,
    }),
    new CopyPlugin({
      patterns: [
        //{ from: "src/index.html" },
        {
          from: path.resolve(__dirname, "./src/assets"),
          to: "./assets",
        },
        { from: path.resolve(__dirname, "./src/robots.txt"), to: "robots.txt" },
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
    new CompressionPlugin({
      deleteOriginalAssets: argv.mode === "production",
    }),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: "body",
      template: "src/index.html",
    }),
    //new BundleAnalyzerPlugin()
  ],
  devServer: {
    contentBase: "./dist",
  },
});

module.exports = config;
