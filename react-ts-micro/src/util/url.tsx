export default {
  /**
   * 获取链接参数
   * @param url 链接
   * @param name 参数名称
   */
  getUrlParameter(url: string, name: string) {
    const regexSearch = "[\\?&#]" + name + "=([^&#]*)";
    const regex = new RegExp(regexSearch);
    const results = regex.exec(url);
    return results ? window.decodeURIComponent(results[1]) : '';
  },
  /**
   * 拼接链接参数
   * @param url 链接
   * @param params 参数名称
   */
  formatUrl(url: string, params: Object = {}) {
    // 来源字段
    const source = this.getUrlParameter(window.location.href, 'source');
    if (source) params['source'] = source;

    const paramStr = Object.keys(params).filter(item => params[item] !== '').map((item: string) => `${item}=${params[item]}`).join('&');
    return paramStr !== '' ? `${url.split('?')[0]}?${paramStr}` : `${url.split('?')[0]}`;
  },
}
