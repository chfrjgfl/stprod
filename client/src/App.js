import React from "react";
import logo from "./logo.svg";
//import "./App.css";
import Options from "./Options.js";
import './Options.css';

function App() {
  const [data, setData] = React.useState(null);

//    React.useEffect(() => {
//      fetch("/api", {
//     method: "POST", 
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({name: "John", age:23}),
// //    mode: "no-cors"
//   })
//        .then((res) => res.json())
//        .then((data) => alert(data.name));
//    }, []);

  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{!data ? "Loading..." : data}</p>
      </header> */}
      <Options />
    </div>
  );
}

export default App;