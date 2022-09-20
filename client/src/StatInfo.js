import React, { useState } from 'react';
//import ReactDOM from 'react-dom/client';
import './StatInfo.css';
import { Chart } from "react-google-charts";
import ReactSlider from "react-slider";


function StatInfo (props) {
    const { statInfo, statArr, aboveArr } = props.data;
    // const statArr = arrSort(props.data.statArr.slice());
    const [mode, setMode] = useState('0');
    const [sliderValue, setSliderValue] = useState (0);
    const [worthIt, setWorthIt] = useState ({val: 0, arr: statInfo[mode]
                          .filter(el => el.fname === '% Negative')[0].array.slice(0, 3)});

    const wide = statInfo[0][statInfo[0].length-1].array.length > 3;
    //const wMode = wide? "100%": "400px";
    const percentiles = [10, 20, 30, 40, 50, 60, 70, 80, 83.35, 90];
    const maxSlider = Math.floor(Math.max.apply(null, statInfo[mode].filter(el => el.fname === '90th Percentile')[0].array));
    // const worthIt = {val: 0, arr:[0, 0, 0]};


    const chartOptions = {
      width: "100%",
      chartArea: { //width: "85%",
                            height: "auto", 
                            backgroundColor: "beige",
                            left: 50,
                            right: 10,
                          },
            
      legend:{
        position: "bottom",
      },
      lineWidth: 3,
      crosshair: { trigger: 'both' },
      focusTarget: 'category', 
      
    }

    function setStatArrValue (v) {
      worthIt.val = v;
      worthIt.arr[0] = v;
    }

    function handleChange(event) {
      setMode(event.target.value);
      setWorthIt({val: sliderValue, 
        arr: statArr[mode].slice(0, 3).map(el => ((el.reduce((a, b) => {if(b > sliderValue) {a++;}return a;}, 0) * 100/el.length).toFixed(2)))})
   }

//    function arrSort(arr) {
//     return arr.slice().map(el => el.map(e => e.sort((a, b) => a - b)));
// }

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
                        <th> C.Miss. </th> 
                        <th> C.Paid </th> 
                        <th> Life, Mnts </th> 
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

          {/* <tr key='sl'>
            <td>% Return &gt; {worthIt.val} %</td>
            {worthIt.arr.map(el => <td>{el}</td>)}
          </tr> */}

        </tbody>
      </table>

{/* <div className='slider-container'>
     <div><ReactSlider 
        className="customSlider"
        trackClassName="customSlider-track"
        thumbClassName="customSlider-thumb"
        max={maxSlider}
        defaultValue={0}
        value={sliderValue}
        onChange={(value) => setSliderValue(value)}
        onAfterChange = {(value) => setWorthIt({val: value, 
                          arr: statArr[mode].slice(0, 3)
                          .map(el => ((el
                              .reduce((a, b) => {
                                  if(b > value) {a++;}
                                  return a;}, 0) * 100/el.length).toFixed(2)))})}
        // renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
      /> </div><div> {sliderValue}</div>
</div> */}


{/* array: statArr[mode].map(el => ((el.reduce((a, b) => {if(b > sliderValue) {a++;}return a;}, 0) * 100/el.length).toFixed(2)) */}


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
            .map((el, ind) => ([el, statInfo[mode].filter(el => el.fname === '% Negative')[0].array[ind]])))}
      options={{
        title: "% Negative",
        pieHole: 0.4,
        is3D: false,
        // chartArea:{left:0,width:'50%',height:'75%'}
      }}
    />

{/* <Chart
      // className = "donut"
      key={worthIt.val}
      chartType="PieChart"
       width = "400px"
      height="auto"
      
      // data={[["Prod", "Outperforms"]].concat(['StProd ', 'IndBlend ', 'Bond ']
      //       .map((el, ind) => ([el, worthIt.arr[ind]])))}

      data={[["Prod", "Outperforms"],
            ['StProd ', worthIt.arr[0]],
            ['IndBlend ', worthIt.arr[1]],
            ['Bond ', worthIt.arr[2]] 
          ]}
      options={{
        title: "% Above",
        pieHole: 0.4,
        is3D: false,
        // chartArea:{left:0,width:'50%',height:'75%'}
      }}
    /> */}

<Chart
      chartType="LineChart"
      key={wide}
      //  width = {wide? "100%": "400px"}
      width="100%"
      // style={{display:inline-block}}
      height="500px"
      data={[
        ["%Return > x %", 'StProd', 'IndBlend', 'Bond']
            ].concat(aboveArr[mode])}
      options={{...chartOptions, hAxis: {
        title: "%Return > x %",
        
            },
            vAxis: {
              title: "Frequency %",
            },
    }}
    />

<Chart
      chartType="LineChart"
      key={wide+1}
      //  width = {wide? "100%": "400px"}
      width="100%"
      // style={{display:inline-block}}
      height="500px"
      data={[
        ["Percentile", 'StProd', 'IndBlend', 'Bond'],
        // [0].concat(statInfo[+mode].filter(el => el.fname === 'Minimum')[0].array.slice(0, 3))
            ].concat(percentiles.map(p => [p].concat(statInfo[+mode]
                        .filter(el => el.fname.includes(p))[0].array.slice(0, 3))))}
      options={{...chartOptions, hAxis: {
        title: "Percentile",
        // gridlines: { color: '#555', 
        //     count: 3, interval: [0, 20] },
        ticks: percentiles   
      },
       vAxis: {title: "Return %",
      // baseline: 83.35
    },
        }}  
    />

    </fieldset>

      </>
    );
  
}



export default StatInfo;

