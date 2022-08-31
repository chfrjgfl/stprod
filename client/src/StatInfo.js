import React from 'react';
import ReactDOM from 'react-dom/client';
import './StatInfo.css';


function renderStatInfo (statInfo) {
    alert (statInfo.length);

    return (
        <>
         <div className="StatInfo" style = "left: 200; border: 2px solid #e66465;">
         
        <table>
        {/* <caption>Our products</caption> */}
        <thead>
          <tr key = "head">
                       <th>  </th>                  
                       <th> StProd </th>
                       <th> IndexBlend TR </th>
                       <th> Bond TR </th>           
            {statInfo[statInfo.length-1].array.length > 3 && <>
                        <th> CoupMissed </th> 
                        <th> CoupPaid </th> 
                        <th> LifeInMonths </th> 
                        </>
            }
          </tr>
        </thead>
        <tbody>
          {statInfo.map((el, ind) => (
            <tr key={ind.toString()}>
              <td>{el.fname}</td>
              {el.array.map(a => (
                <td>{a}</td>))}  
            </tr>
          ))}
        </tbody>
      </table>
         </div>
      </>   
      );
}


function StatInfo (props) {
    const { statInfo } = props;
    return (
      <table>
        <thead>
          <tr>
                       <th>  </th>                  
                       <th> StProd </th>
                       <th> IndexBlend TR </th>
                       <th> Bond TR </th>           
            {statInfo[statInfo.length-1].array.length > 3 && <>
                        <th> CoupMissed </th> 
                        <th> CoupPaid </th> 
                        <th> LifeInMonths </th> 
                        </>
            }
          </tr>
        </thead>
        <tbody>
          {statInfo.map((el, ind) => (
            <tr key={ind}>
              <td>{el.fname}</td>
              {el.array.map(a => (
                <td>{a}</td>))}  
            </tr>
          ))}
        </tbody>
      </table>
    );
  
}



export default StatInfo;