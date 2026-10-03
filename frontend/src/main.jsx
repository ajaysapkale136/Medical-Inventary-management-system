// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import Home from './Home.jsx' // <-- Now importing Home instead of App

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <Home /> {/* <-- Now rendering Home */}
//   </React.StrictMode>,
// )

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);