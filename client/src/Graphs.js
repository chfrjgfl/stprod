import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './StatInfo.css';
import { Chart } from "react-google-charts";


function Graphs (props) {
    const { statArr, statInfo } = props.data;
    const [mode, setMode] = useState('0');

    const data = [['index', 'return']].concat(statArr[1].map((el, ind) => [ind.toString(), el]));

    const options = {
        title: "Distribution",
        legend: { position: "none" },
        colors: ["#4285F4"],
        chartArea: { width: 'auto' },
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
          lastBucketPercentile: 1,
        },
      };

    return (
      <>
            <Chart
                chartType="Histogram"
                width="100%"
                height="400px"
                data={data}
                options={options}
            />     
      </>
    );
  
}



export default Graphs;