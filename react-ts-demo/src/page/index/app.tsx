import React, { useEffect, useState } from "react";
import Header from "@/component/header";
import Button from "@/component/button";
// import {getVal} from '@/utils/index.js'
import "./app.scss";
// const Header = React.lazy(()=>import('@/component/header'))
const App = () => {
  const [isLogin, setLoginState] = useState(false);
 
  useEffect(() => {
    
  }, []);

  const loginHandle = () => {
    !isLogin ? setLoginState(true) : setLoginState(false);
  };

  const selectHandle = (id: number) => {
  
  };
  return (
    <div className="page page-bg">
      <div className="login">
        <div className="info">登录状态：{isLogin ? "已登录" : "未登录"}</div>
        <Button
          className="btn"
          type='primary'
          onClick={() => {
            loginHandle();
          }}
        >
          {isLogin ? "注销" : "登录"}
        </Button>
      </div>
    </div>
  );
};

export default App;
