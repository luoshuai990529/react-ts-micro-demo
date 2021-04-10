/// <reference types='react' />

declare module 'baseMicro/urlUtil' {
  interface type {
    getUrlParameter: Function,
    formatUrl: Function,
  }
  const UrlUtil: type;
  export default UrlUtil;
}

declare module 'baseMicro/Button' {
  const Button: type;
  export default Button;
}
