import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './StatInfo.css';
import { Chart } from "react-google-charts";


function StatInfo (props) {
    const { statInfo } = props;
    const [mode, setMode] = useState('0');

    const wide = statInfo[0][statInfo[0].length-1].array.length > 3;
    const wMode = wide? "100%": "400px";
    const percentiles = [10, 20, 30, 40, 50, 60, 70, 80, 83.35, 90, 100];

    const chartOptions = {
      chartArea: { width: "90%",
                            height: "auto", 
                            backgroundColor: "beige",
                            left: 10,
                          },
      hAxis: {
        title: "Percentile",
      },
      
      legend:{
        position: "bottom",
      }
      
    }

    function handleChange(event) {
      setMode(event.target.value);
   }

    return (
      <>
        <fieldset className = "table">
                <legend> Stats Summary </legend>

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
                { wide && <>
                        <th> CoupMissed </th> 
                        <th> CoupPaid </th> 
                        <th> LifeInMonths </th> 
                        </>
            }
          </tr>
        </thead>
        <tbody>
          {statInfo[mode].map((el, ind) => (
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
      key = "d1"
      chartType="PieChart"
       width = "400px"
      height="auto"
      
      data={[["Prod", "Outperforms"]].concat(['StProd ', 'IndBlend ', 'Bond ']
            .map((el, ind) => ([el, statInfo[mode].filter(el => el.fname === '% Outperforms')[0].array[ind]])))}
      options={{
        title: "Outperforming Product",
        pieHole: 0.4,
        is3D: false,
        // chartArea:{left:0,width:'50%',height:'75%'}
      }}
    />

<Chart
      // className = "donut"
      key="d2"
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
      key={wide}
      //  width = {wide? "100%": "400px"}
      width="100%"
      // style={{display:inline-block}}
      height="500px"
      data={[
        ["Percentile", 'StProd', 'IndBlend', 'Bond'],
        [0].concat(statInfo[+mode].filter(el => el.fname === 'Minimum')[0].array.slice(0, 3))
            ].concat(percentiles.map(p => [p].concat(statInfo[+mode]
                        .filter(el => el.fname.includes(p))[0].array.slice(0, 3))))}
      options={chartOptions}
    />

    </fieldset>

      </>
    );
  
}



export default StatInfo;

