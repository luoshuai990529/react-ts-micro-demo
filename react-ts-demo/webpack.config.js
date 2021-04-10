const os = require('os');
const fs = require('fs');
const path = require('path');
const env = require('node-env-file');
const webpack = require('webpack');
const UploadAlisOSSPlugin = require('./build/upload-ali-oss-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ModuleFederationPlugin } = require('webpack').container; //模块联邦
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const package = require('./package.json');
const resolve = dir => path.resolve(__dirname, dir);
const pageDirPath = './src/page'; // 页面目录路径

// 加载环境文件
const envFile = resolve('.env');
if (fs.existsSync(envFile)) env(envFile);

/**
 * 获取页面入口
 */
const getEntry = () => {
    const pageDir = resolve(pageDirPath) //获取页面目录的绝对路径 D:\Project\React\react-ts-demo\src\page
    // readdirSync：读pageDir下的文件
    // statSync:判断一个文件是否存在  isDirectory()并且是一个文件夹
    return fs.readdirSync(pageDir).filter(item => fs.statSync(path.resolve(pageDir, item)).isDirectory());
}
const getEntryMap = () => {
    const entry = {};
    getEntry().forEach(item => {
        entry[item] = `${pageDirPath}/${item}/index`;
    });
    return entry;
}
/**
 * 生成多页面配置
 */
const getHtmlWebpackPlugin = (isDev) => {
    return getEntry().map(item => new HtmlWebpackPlugin({
        filename: isDev ? `${item}.html` : `../${item}.html`,
        template: './public/index.html', //加载自定义模板
        chunks: [item]
    }))
}

/**
 * 获取本机IP地址
 */
const getIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}

/**
 * 获取前端微服务链接
 * @param {string} target
 */
const getMicro = (target) => {
    console.log('target:',target);
    const name = 'base-micro';
    const version = '0.3.4';
    const urlMap = {
        local: `baseMicro@http://${getIPAddress()}:6001/remoteEntry.js`, //本地开发
        test: `baseMicro@http://static.test.xiaopeng.local/apps/${name}/remoteEntry_${version}.js`,//测试环境
        staging: `baseMicro@https://static.deploy-test.xiaopeng.com/apps/${name}/remoteEntry_${version}.js`, //预发布环境
        product: `baseMicro@https://static.xiaopeng.com/apps/${name}/remoteEntry_${version}.js`, //生产环境
    };
    const url = urlMap[target] || urlMap.product;
    console.log(`${url}?t=${Date.now()}`);
    return `${url}?t=${Date.now()}`;
}

module.exports = (env, argv) => {
    // console.log('argv---', argv); //{ mode: 'development', env: { WEBPACK_SERVE: true } }
    const { mode = 'production' } = argv;
    const isDev = mode == 'development' // 判断开发模式

    return {
        devtool: isDev ? false : 'source-map',// 生产环境存储打包前后代码映射关系
        entry: getEntryMap(),
        mode,
        devServer: {
            host: '0.0.0.0',
            port: 8087,
            publicPath: '/', //告知 webpack-dev-server，将 dist 目录下的文件 serve 到 localhost:8087 下
            useLocalIp: true, //此选项使浏览器可以使用的本地IP打开
            open: false,
            disableHostCheck: true //当将此项配置设置为 true 时，将会跳过 host 检查
        },
        output: {
            path: resolve('dist'),// 输出路径
            filename: isDev ? '[name].js' : '[name]_[chunkhash:8].js',
            publicPath: isDev ? './' : (process.env.CDN || '/static/') //打包后 引入js的路径  配置发布到线上资源的 URL 前缀
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js'], //配置省略文件路径的后缀名
            alias: {
                '@': resolve('src') //配置路径别名
            }
        },
        module: {
            rules: [
                {
                    test: /bootstrap\.tsx$/,
                    use: [
                        {
                            loader: 'bundle-loader',
                            options: {
                                lazy: true,
                            },
                        },
                        'ts-loader'
                    ]
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: false,
                                importLoaders: 2 // importLoaders 选项允许你配置在 css-loader 之前有多少 loader 应用于@imported 资源
                            }
                        },
                        'postcss-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    outputStyle: 'expanded' // 输出格式 expanded（扩展）格式更像是手写的CSS样式，每个属性和规则都独占用一行。
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                            },
                        },
                        {
                            loader: 'postcss-loader'
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    loader: 'url-loader',
                    options: {
                        limit: 8192,
                    }
                },
            ]
        },
        plugins: [
            new CleanWebpackPlugin(),
            // new webpack.DefinePlugin({
            //     'process.env': {
            //       'TARGET': JSON.stringify(process.env.TARGET),
            //       'REACT_APP_VERSION': JSON.stringify(package.version),
            //       'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
            //       'SENTRY_PROJECT_NAME': JSON.stringify(process.env.SENTRY_PROJECT_NAME || ''),
            //     }
            // }),
            ...getHtmlWebpackPlugin(isDev),
            new MiniCssExtractPlugin({
                ignoreOrder: true, //移除 Order 警告
                filename: isDev ? '[name].css' : '[name]_[chunkhash:8].css', //每个 CSS 文件的名称
            }),
            new ModuleFederationPlugin({
                name: 'xpFeSsoEurope',
                remotes: {
                    baseMicro: getMicro(process.env.TARGET),
                },
                shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
            }),

            // 自定义oss上传插件
            // new UploadAlisOSSPlugin({
            //     dryRun: isDev,
            //     region: process.env.OSS_REGION,
            //     accessKeyId: process.env.OSS_AccessKeyID,
            //     accessKeySecret: process.env.OSS_AccessKeySecret,
            //     bucket: process.env.OSS_BUCKET,
            //     prefix: process.env.OSS_PREFIX,
            // }),
        ],
        optimization: {
            minimize: !isDev // 是否压缩js代码
        }
    }
}