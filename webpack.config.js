const webpack = require("webpack");

module.exports = {
    entry: {
        "./dist/index": "./src/index.js",
    },
    output: {
        path: `${ __dirname }`,
        filename: "[name].js",
        library: "dejunk",
        libraryTarget: "umd"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: `babel-loader`,
                query: {
                    presets: [`es2015`]
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ minimize: true })
    ]
}
