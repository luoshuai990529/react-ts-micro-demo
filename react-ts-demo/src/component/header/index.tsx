import React from "react";
import "./index.scss";
interface PropsType {
  type?: string;
}

export default (props: PropsType) => {
  return (
    <div className="header">
      我是头部组件
    </div>
  );
};
