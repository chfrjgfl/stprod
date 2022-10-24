import React, { useState } from 'react';
//import ReactDOM from 'react-dom/client';
import './Graph.css';
import { Chart } from "react-google-charts";

function Raw (props) {

        const { statArr, statInfo, worstArr, histPRArr } = props.data.data;
        const indexes = props.data.options.indexes;
//        const prodType = props.data.options.prodType;
        //const[y,m] = props.data.startDate.split('-')
        const startDate = new Date(props.data.data.startDate);

        const data = [["Date", "StProd", "IndBlend", "Bond", "Worst"]]
                .concat(statArr[0][0].map((el, i) => [calcDate(startDate, i), el, statArr[0][1][i], statArr[0][2][i], worstArr[i]]));
        const histData = [["Date"].concat(indexes)]
                .concat(histPRArr[0].map((el, i) => [calcDate(startDate, i), el, histPRArr[1][i], histPRArr[2][i]]));

        const options = {
            chartArea: { height: "70%", width: "100%", left: "5%",
            
            },
            backgroundColor: "beige",
            series: {
              3: {
                color: "black",
                lineWidth: 2,
                lineDashStyle: [2, 2],
              }
            },

            title:"Performance over rtp's %",
            hAxis: { slantedText: false, 
            format: 'MMM y'},
            vAxis: {
              baseline: props.data.options.principalBarrier,
              baselineColor: "red",
            },
            //vAxis: { viewWindow: { min: 0, max: 2000 } },
            legend: { position: "bottom" },
            lineWidth: 3,
            crosshair: { trigger: 'both' },
            curveType: "function",
            focusTarget: 'category',
            explorer:{zoomDelta: 1.05,
              maxZoomOut: 0.95,
              maxZoomIn: 3.5,},
            };
        

        return (
            
 
          <fieldset className = "raw" key="fr">
            <legend> Raw Data </legend>
         {/* <div className='rawdiv'>   */}
            <Chart
      chartType="LineChart"
      key = "r1"
      width="100%"
      height="400px"
     // left = "20%"
      data={data}
      options={options}
      chartPackages={["corechart", "controls"]}
      controls={[
        {
          controlType: "ChartRangeFilter",
          options: {
            filterColumnIndex: 0,
            //height:30,
            ui: {
              chartType: "LineChart",
             
              chartOptions: {
                //backgroundColor: "pink",

                chartArea: {  height: "50%", 
                left: "10%", 
                right: "10%", 

                 },  //width: "81%",
                 series: {
                  3: {                    
                    lineWidth: 0,
                  }
                },
                hAxis: { baselineColor: "none" },
              },
            },
          },
          controlPosition: "bottom",
          controlWrapperParams: {
            state: {
              range: {
                start: new Date(1997, 1, 1),
                end: new Date(2002, 2, 1),
              },
            },
          },
        },
      ]}
    />

{/* <div className='rawdiv'> */}
<Chart
// className='rawdiv'
      chartType="LineChart"
      key = "r2"
      width="100%"
      height="400px"
      style={{position:"relative", top:"80px"}}
      
     // left = "20%"
      data={histData}
      options={{...options,
        title:"Underlying indexes, monthly",
        vAxis: {
          baseline: 0,
          baselineColor: "black",
        },
      }}
      chartPackages={["corechart", "controls"]}

      render={({ renderControl, renderChart }) => {
        return (
          <div style={{  }}>
            <div style={{ width: "100%",height:"400px" }}>{renderChart()}</div>
            <div style={{ position:"relative",width: "100%", height:"50%", top:"80px" }}>{renderControl(() => true)}</div>
            
          </div>
        );
      }}

      controls={[
        {
          controlType: "ChartRangeFilter",
          position:"relative", top:"80px",
          options: {
            filterColumnIndex: 0,
            //height:30,
            ui: {
              chartType: "LineChart",
              chartOptions: {
                //backgroundColor: "pink",

                chartArea: {  height: "50%", 
                
                left: "10%", 
                right: "10%", 

                 },  //width: "81%",
                 series: {
                  3: {                    
                    lineWidth: 0,
                  }
                },
                hAxis: { baselineColor: "none" },
              },
            },
          },
          controlPosition: "bottom",
          controlWrapperParams: {
            state: {
              range: {
                start: new Date(1997, 1, 1),
                end: new Date(2002, 2, 1),
              },
            },
          },
        },
      ]}
    />
      {/* </div>       */}
            {/* </div>         */}
            
            </fieldset>
 
        )
}

function calcDate(date, n) {
    let d = new Date(date);
    //let m = d.getMonth();
    d.setMonth(d.getMonth() + n);
    
    return d;
}

export default Raw;