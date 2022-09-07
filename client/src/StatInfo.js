import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './StatInfo.css';
import { Chart } from "react-google-charts";


function StatInfo (props) {
    const { statInfo } = props;
    const [mode, setMode] = useState('0');

    const percentiles = [10, 20, 30, 40, 50, 60, 70, 80, 83.35, 90, 100];
    const wMode = mode==='0'? "100%": "400px";

    function handleChange(event) {
      setMode(event.target.value);
   }

    return (
      <>
                  <input type="radio" id="3" onChange={event => handleChange(event)}
                    name="mode" value="0" checked={mode === '0' ? true : false} /> 
                    <label className="radiolabel" htmlFor="3">Any Ind Active</label>

                    <input type="radio" id="4" onChange={event => handleChange(event)}
                    name="mode" value="1" checked={mode === '1' ? true : false} />  
                    <label className="radiolabel" htmlFor="4">3 Inds Active</label>

      <table>
        <thead>
          <tr>
                       <th>  </th>                  
                       <th> StProd </th>
                       <th> IndexBlend TR </th>
                       <th> Bond TR </th>           
            {statInfo[0][statInfo[0].length-1].array.length > 3 && <>
                        <th> CoupMissed </th> 
                        <th> CoupPaid </th> 
                        <th> LifeInMonths </th> 
                        </>
            }
          </tr>
        </thead>
        <tbody>
          {statInfo[+mode].map((el, ind) => (
            <tr key={ind}>
              <td>{el.fname}</td>
              {el.array.map(a => (
                <td>{a}</td>))}  
            </tr>
          ))}
        </tbody>
      </table>

      <Chart
      // className = "donut"
      chartType="PieChart"
       width = "400px"
      height="auto"
      
      data={[["Prod", "Outperforms"]].concat(['StProd ', 'IndBlend ', 'Bond ']
            .map((el, ind) => ([el, statInfo[+mode].filter(el => el.fname === '% Outperforms')[0].array[ind]])))}
      options={{
        title: "Outperforming Product",
        pieHole: 0.4,
        is3D: false,
        // chartArea:{left:0,width:'50%',height:'75%'}
      }}
    />

<Chart
      // className = "donut"
      chartType="PieChart"
       width = "400px"
      height="auto"
      
      data={[["Prod", "Outperforms"]].concat(['StProd ', 'IndBlend ', 'Bond ']
            .map((el, ind) => ([el, statInfo[+mode].filter(el => el.fname === '% Negative')[0].array[ind]])))}
      options={{
        title: "% Negative",
        pieHole: 0.4,
        is3D: false,
        // chartArea:{left:0,width:'50%',height:'75%'}
      }}
    />

<Chart
      chartType="LineChart"
      width = {wMode}
      height="500px"
      data={[
        ["x", 'StProd', 'IndBlend', 'Bond'],
        [0].concat(statInfo[+mode].filter(el => el.fname === 'Minimum')[0].array.slice(0, 3))
            ].concat(percentiles.map(p => [p].concat(statInfo[+mode]
                        .filter(el => el.fname.includes(p))[0].array.slice(0, 3))))}
      options={{
        hAxis: {
          title: "Percentile",
        },
        vAxis: {
          title: "Value",
        },
        // series: {
        //   1: { curveType: "function" },
        // },
      }}
    />

      </>
    );
  
}



export default StatInfo;

// export const data = [
//   ["x", 'StProd', 'IndBlend', 'Bond'],
//   [0, 0, 0, 0]].concat(percentiles.map(el => [el].concat(statInfo[+mode].filter(el => el.fname.includes(el.toString()))[0].array)))

// [10, 10, 5],
//   [20, 23, 15],
//   [30, 17, 9],
//   [40, 18, 10],
//   [50, 9, 5],
//   [60, 11, 3],
//   [70, 27, 19],