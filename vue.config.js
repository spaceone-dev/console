module.exports = {
    lintOnSave: false,
    runtimeCompiler: true,
    devServer: {
        host: 'cloudone.console.stg.pyengine.net',
        port: 8080
    },
    css: {
        loaderOptions: {
            sass: {
                data: `
                @import "~@/asset/style/_variables.scss";
                @import "~@/asset/style/_font.scss";
                `
            }
        }
    },
    configureWebpack: {
        resolve: {
            alias: {
            }
        },
        devtool: 'source-map'
    }
};
