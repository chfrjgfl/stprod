import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './Graph.css';
import { Chart } from "react-google-charts";


function Graphs (props) {
    const { statArr, statInfo } = props.data;
    // const [mode, setMode] = useState('0');

  //  const data = [['index', 'return']].concat(statArr[1].map((el, ind) => [ind.toString(), el]));

    const options = {
  //      title: "Distribution",
        legend: { position: "none" },
        colors: ["#4285F4"],
         chartArea: { width: "90%",
                      height: "auto", 
                      backgroundColor: "beige",
                      right: 10,
                    },
        // forceIFrame: true,           
        hAxis: {
          title: 'Return',  
          //ticks: [-10, , 0, 10, 20, 30, 40],
        },
        bar: { gap: 0 },
        histogram: {
          bucketSize: 2,
          maxNumBuckets: 200,
        //   minValue: 0,
        //   maxValue: 30,
          lastBucketPercentile: 2,
        },
        // width: "auto"
      };

  function changeValue(o, key, value) {
    const oo = Object.assign(o);
    oo[key] = value;
    return oo;
  }

    return (
      <>
      {statArr.slice(0, 3).map((ar, i) => (                                

           <Chart
                chartType="Histogram"
                key = {i.toString()}
                data={[['index', 'return']].concat(ar.map((el, ind) => [ind.toString(), el]))}
                options={ {title: ['StProd ', 'IndBlend ', 'Bond '][i]+'distribution' ,
                // legend: { position: "none" },
                colors: ["#4285F4"],
                 chartArea: { width: "90%",
                              height: "auto", 
                              backgroundColor: "beige",
                              right: 10,
                            },
                hAxis: {
                  title: 'Return',  
                },
                bar: { gap: 0 },
                histogram: {
                  bucketSize: 2,
                  maxNumBuckets: 200,                
                  lastBucketPercentile: 2,
                }
              }}         
                // title={['StProd ', 'IndBlend ', 'Bond '][i]+options.title}
            /> 
      
      ))}  
      </>
    );
  
}

export default Graphs;