import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './StatInfo.css';


// function renderStatInfo (statInfo) {

//   //style = "left: 200; border: 2px solid #e66465;"

//     return (
//         <>
//          <div className="StatInfo" >
         
//         <table>
//         <thead>
//           <tr key = "head">
//                        <th>  </th>                  
//                        <th> StProd </th>
//                        <th> IndexBlend TR </th>
//                        <th> Bond TR </th>           
//             {statInfo[statInfo.length-1].array.length > 3 && <>
//                         <th> CoupMissed </th> 
//                         <th> CoupPaid </th> 
//                         <th> LifeInMonths </th> 
//                         </>
//             }
//           </tr>
//         </thead>
//         <tbody>
//           {statInfo.map((el, ind) => (
//             <tr key={ind.toString()}>
//               <td>{el.fname}</td>
//               {el.array.map(a => (
//                 <td>{a}</td>))}  
//             </tr>
//           ))}
//         </tbody>
//       </table>
//          </div>
//       </>   
//       );
// }


function StatInfo (props) {
    const { statInfo } = props;
    const [mode, setMode] = useState('0');

    function handleChange(event) {
      setMode(event.target.value);
   }

    return (
      <>
                  <input type="radio" id="3" onChange={event => handleChange(event)}
                    name="mode" value="0" checked={mode == '0' ? true : false} /> 
                    <label className="radiolabel" htmlFor="3">Any Ind Active</label>

                    <input type="radio" id="4" onChange={event => handleChange(event)}
                    name="mode" value="1" checked={mode == '1' ? true : false} />  
                    <label className="radiolabel" htmlFor="4">3 Inds Active</label>

      <table>
        <thead>
          <tr>
                       <th>  </th>                  
                       <th> StProd </th>
                       <th> IndexBlend TR </th>
                       <th> Bond TR </th>           
            {statInfo[0][statInfo.length-1].array.length > 3 && <>
                        <th> CoupMissed </th> 
                        <th> CoupPaid </th> 
                        <th> LifeInMonths </th> 
                        </>
            }
          </tr>
        </thead>
        {/* {mode == "3" &&  */}
        <tbody>
          {statInfo[+mode].map((el, ind) => (
            <tr key={ind}>
              <td>{el.fname}</td>
              {el.array.map(a => (
                <td>{a}</td>))}  
            </tr>
          ))}
        </tbody>
        {/* } */}
      </table>

      </>
    );
  
}



export default StatInfo;