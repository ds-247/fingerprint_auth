import React, { useState } from "react";
import LoginForm from "./components/Login";
import RegisterForm from "./components/Register";

const App = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{isLogin ? "Login" : "Register"}</h1>
      <div>
        <button
          onClick={() => setIsLogin(true)}
          style={{ marginRight: "10px" }}
        >
          Login
        </button>
        <button onClick={() => setIsLogin(false)}>Register</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
};

export default App;
