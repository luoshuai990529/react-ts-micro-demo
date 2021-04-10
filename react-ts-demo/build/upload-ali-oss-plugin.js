const OSS = require('ali-oss');
const Buffer = require('buffer').Buffer;
const pluginName = 'UploadAlisOSSPlugin';

class UploadAlisOSSPlugin {

  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    // 在emit阶段插入钩子函数
    if (compiler.hooks && compiler.hooks.emit) { // webpack 5
      console.log('apply方法执行webpack5 tapAsync');
      compiler.hooks.emit.tapAsync(pluginName, (compilation, cb) => { //异步钩子，通过callback回调告诉Webpack异步执行完毕
        this.pluginEmitFn(compilation, cb);
      });
    } else {
      console.log('apply方法执行webpack emit');
      compiler.plugin('emit', (compilation, cb) => {
        this.pluginEmitFn(compilation, cb);
      });
    }
  }

  pluginEmitFn(compilation, cb) {
    this.log('pluginEmitFn方法执行-----');
    const { dryRun = false } = this.options;
    if (dryRun) {
      this.log('DRY Run Mode');
      cb();
      return;
    }

    const files = this.pickupAssetsFiles(compilation);
    const promises = files.map(item => {
      this.put(item.name, Buffer.from(item.content))
    });
    Promise.all(promises).then(() => {
      // 这里通过cb回调告诉webpack 文件上传完毕
      cb();
    });
  }

  log(info) {
    console.log(`[${pluginName}] ${info}`);
  }

  error(info, err) {
    console.error(`[${pluginName}] ${info}`, err);
  }

  /**
   * 上传文件
   * 
   * @param {*} name
   * @param {*} content
   */
  async put(name, content) {
    console.log('put方法执行-----',name,'-----',content);
    const { region, accessKeyId, accessKeySecret, bucket, prefix } = this.options;
    const client = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
    });
    try {
      let result = await client.put(prefix +"/"+ name, content);
      this.log(`上传成功: ${result.name}`);
    } catch (e) {
      console.log('--------------上传失败---------------',e)
      // this.error('上传失败: %j', e);
    }
  }

  /**
   * 从 compilation 对象中提取资源文件
   * 
   * @param {*} compilation 
   */
  pickupAssetsFiles(compilation) {
    const re = /.*.?(jpg|png|gif)$/i;
    const keys = Object.keys(compilation.assets);
    return keys.reduce((acc, cur) => {
      if (re.test(cur)) {
        const asset = compilation.assets[cur];
        acc.push({
          name: cur,
          content: asset.source(),
        });
      }
      return acc;
    }, []);
  }
}

module.exports = UploadAlisOSSPlugin;