import React from "react";
//import logo from "./logo.svg";
//import "./App.css";
import Options from "./Options.js";
import './Options.css';

function App() {
  const [data, setData] = React.useState(null);


  return (
    <div className="App">
      
      <Options />
    </div>
  );
}

export default App;

// import React, { useState } from 'react';

// function App() {
//    const [value, setValue] = useState(1);
   
//    function chengeValue() {
//       setValue(event.target.value);
//    }

//    return <div>
//       <input type="radio" name="radio" value="1"
//       checked={value == '1' ? true : false}
//       onChange={chengeValue} />

//       <input type="radio" name="radio" value="2"
//       checked={value == '2' ? true : false}
//       onChange={chengeValue} />

//       <input type="radio" name="radio" value="3"
//       checked={value == '3' ? true : false}
//       onChange={chengeValue} />
//    </div>;
// }

// export default App;