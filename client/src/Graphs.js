import React, { useState } from 'react';
//import ReactDOM from 'react-dom/client';
import './Graph.css';
import { Chart } from "react-google-charts";
//import { min } from 'simple-statistics';


function Graphs (props) {

function findIndexNew(ar, el)  {
  let x = ar.findIndex(a => a > el);
  if (x < 0) x = ar.length;
  if (el > 0) x++;
  return x;
}

function handleInputChange(event) {
  const value = event.target.checked;
  setNorm(value);  
}

function handleInputChangeM(i) {
  const updatedScatter = scatter.map((el, ind) =>
      ind === i ? !el : el
    );
  setScatter(updatedScatter);  
}

    const { statArr, statInfo } = props.data;
    const prodType = props.data.options.prodType;
   const [norm, setNorm] = useState(false);
   const [scatter, setScatter] = useState([true, true]);

  //  const data = [['index', 'return']].concat(statArr[1].map((el, ind) => [ind.toString(), el]));

  //   const options = {
  // //      title: "Distribution",
  //       legend: { position: "none" },
  //       colors: ["#4285F4"],
  //        chartArea: { width: "90%",
  //                     height: "auto", 
  //                     backgroundColor: "beige",
  //                     right: 10,
  //                   },
  //       // forceIFrame: true,           
  //       hAxis: {
  //         title: 'Return',  
  //         //ticks: [-10, , 0, 10, 20, 30, 40],
  //       },
  //       bar: { gap: 0 },
  //       histogram: {
  //         bucketSize: 2,
  //         maxNumBuckets: 200,
  //       //   minValue: 0,
  //       //   maxValue: 30,
  //         lastBucketPercentile: 2,
  //       },
  //       // width: "auto"
  //     };

const lastBucket = Math.min(Math.ceil(statInfo[0].find(el => el.fname === '% Negative').array[0]), 2);

const limits =[0, 1, 2].map((i) => {
                return [statInfo[0].find(el => el.fname === '10th Percentile').array[i]*lastBucket/10 +
                statInfo[0].find(el => el.fname === 'Minimum').array[i]*(1-lastBucket/10),
                statInfo[0].find(el => el.fname === 'Maximum').array[i]*(1-lastBucket/10) +
                statInfo[0].find(el => el.fname === '90th Percentile').array[i]*lastBucket/10]
              });

if (prodType === 'A') limits[0][1] = statInfo[0].find(el => el.fname === 'Maximum').array[0];
if (prodType === 'A') limits[0][0] = 0;
                            

let i = Math.floor(lastBucket*statArr[0][1].length/100);
const stPtoIndAr = statArr[0][1]                                              //[index, stProd]  sorted by index            
                  .map((el,ind) => [el, statArr[0][0][ind]])  
                  .sort((a,b) => a[0]-b[0]);
                 // .slice(i, -i);                                              // tails cut

const indRange = stPtoIndAr[stPtoIndAr.length-1][0] - stPtoIndAr[0][0];   // ind max - ind min
const maxIndBins = Math.sqrt(stPtoIndAr.length);                               // bins qty by google charts default

const binw = [1,2,5,10,20,50].find(el => el >= (indRange/maxIndBins))*(prodType === 'A'? 1: 1); 
                         // bin width rounded to 1.25 coup, 2.5 gr
const histoBuckets = [prodType === 'A'? 1: binw, binw, ''];

let minBin = Math.floor(statInfo[0].find(el => el.fname === 'Minimum').array[1]/binw)*binw;  //min & max bins tied 
const maxBin = Math.ceil(statInfo[0].find(el => el.fname === 'Maximum').array[1]/binw)*binw; //to 10 & 90 perc.

let steps;
let stepsArr = [];
if(prodType === 'B') {
  steps = [];
  let k = Math.floor(statInfo[0].find(el => el.fname === '10th Percentile').array[0]/binw)*binw;
  let j = Math.ceil(statInfo[0].find(el => el.fname === '90th Percentile').array[0]/binw)*binw;
  stepsArr.push('< '+k);
  for (let m = k; m<=j; m+=binw) {
    steps.push(m);
    if(m == 0) stepsArr.push('0');
    if(m < j) stepsArr.push(''+m+'..'+(m+binw));    
  }
  stepsArr.push('> '+j);
}  else  steps = new Set();                   //returns of coupon prod.



 i = stPtoIndAr.findIndex(el => el[0]>=minBin);
stPtoIndAr.splice(0, i);                                                      // and then removed 0-10 perc.
//i = minBin;
const dividedArr = [];                                    // bins of index

                                  //must be pre-set for growth prod. -> "90-10" perc./16  rounded to 2.5 -> to strings.
                                  // 'below 0' - '0 to 2.5' -....-'over xxx'
while(minBin <= maxBin) {
  let spBinArr = stPtoIndAr                             //stProd inside every bin of index, sorted
                .splice(0, stPtoIndAr.findIndex(el => el[0] >= minBin + binw))
                .map(el => prodType === 'A'? el[1]: findIndexNew(steps, el[1]))             //must be bin number for growth prod.
                .sort((a, b) => a - b);
  //i = 1;
  let ar = [];                          // [ [step or bin number, qty]  ]. sorted
      while(spBinArr.length > 0) {
        if(prodType === 'A') steps.add(spBinArr[0]);                       //populating steps for coupon
        i = spBinArr.findIndex(el => el > spBinArr[0]);
        if(i < 0) i = spBinArr.length;
        ar.push([spBinArr[0], i]);
        spBinArr.splice(0, i);
      }
  dividedArr.push([minBin, ar]);  //[bin, [[step or bin number, qty]...]  ]
  minBin += binw;
}

if(prodType === 'A') stepsArr = Array.from(steps).sort((a, b) => a - b).map(el => (el).toString());     // for coupon.   stepsArr must be declared above
// if 'A'

const superHistData = [["Return of IndBlend %"].concat(stepsArr.map(e=>[e,{ role: 'style' }]).flat())];  //here
for (let el of dividedArr) {
  const ar = [el[0]+binw].concat(stepsArr.map(e=>[0,'']).flat());    //here
  //const ar = Array(2*stepsArr.length+1).fill(0);             //here
  //ar[0] = el[0]+binw;
  
  for(let a of el[1]) {
    let i = prodType === 'A'? stepsArr.indexOf(a[0].toString()): a[0];
    
    ar[2*i+1] = a[1];  
     
    let z = prodType === 'A'? 0: stepsArr.indexOf('0');
    let mul = prodType === 'A'? a[0] < 0? -1: Math.floor(120/(+stepsArr[stepsArr.length-1])): 
                              Math.floor(120/stepsArr.length);
    let x = prodType === 'A'? 1: binw;
    let c = a[0] < z? [30+Math.floor(mul*a[0]), 0, 250]: 
                a[0] == z? [222, 222, 222]:
                  (a[0]-z)*x < ar[0]? [0, 250, 30+Math.floor(mul*a[0])]:
                    [250, 30+Math.floor(mul*a[0]), 0]                          //here
    ar[2*i+2] = `color: rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  superHistData.push(ar);
}

                                                       //props.data.options.couponLow/12


//props.data.options.prodType == 'A'?       :2
  // function changeValue(o, key, value) {
  //   const oo = Object.assign(o);
  //   oo[key] = value;
  //   return oo;
  // }

    return (
      <>

    <fieldset className = "graph">
      <legend> Graphs </legend>

      

      {statArr[0].slice(0, 3).map((ar, i) => (                                
    <>
           <Chart
                chartType="Histogram"
                key = {i.toString()}
                data={[['index', 'return']].concat(ar.map((el, ind) => [ind.toString(), el]))}
                options={  {title: ['StProd ', 'IndBlend ', 'Bond '][i]+'distribution' ,
                height: "400px",
                 chartArea: { width: "90%",
                              height: "400px", 
                              backgroundColor: "beige",
                              right: 10,
                            },
                hAxis: {
                  title: 'Return',  
                  viewWindow: {max: limits[i][1],   //statInfo[0].find(el => el.fname === '90th Percentile').array[i],
                            min: limits[i][0],  //statInfo[0].find(el => el.fname === '10th Percentile').array[i],
                },
                explorer: {zoomDelta: 1.05,
                  maxZoomOut: 0.95 },
                },
                histogram: {
                  lastBucketPercentile: 0,  //lastBucket,
                  bucketSize: histoBuckets[i],
                 //maxNumBuckets: 60, 
                  // minValue: statInfo[0].find(el => el.fname === '10th Percentile').array[i],
                  // maxValue: statInfo[0].find(el => el.fname === '90th Percentile').array[i],
                },
                
              } }         
            />  
            
            {(i == 0) && <>

            
            <Chart
            key = "sh"
            chartType="ColumnChart"
            width="100%"
            height="400px"
            data={superHistData}
            options={{
              title: "SuperHistogram IndBlend over StProd",
              chartArea: { width: "90%" },
              left: 0,
              isStacked: norm? "percent": "absolute",
              bar: {
                groupWidth:"93%",
              },
              hAxis: {
                title: "IndBlend Return %",
                //minValue: 0,
                showTextEvery: 1,
                viewWindow: {max: limits[1][1],   //statInfo[0].find(el => el.fname === '90th Percentile').array[1],
                            min: limits[1][0],   //statInfo[0].find(el => el.fname === '10th Percentile').array[1],
                },
              },
              vAxis: {
                //title: "Frequency",
                //scaleType: 'mirrorLog',
              },
              explorer: {zoomDelta: 1.05,
                          maxZoomOut: 0.95 },
              legend: {//pageIndex: 10,
              position: "bottom",},
              
            }}
          />  

          <p className = "chkbx">Normalized <input
            className="check" 
            key="chkbx"
            type="checkbox"
            checked={norm}
            onChange={event => handleInputChange(event)} />
            </p>

          
          </>
            }


        </>
      ))}  

<Chart
      chartType="ScatterChart"
      key="sc1"
      width="auto"
      height="400px"
      data={[['StProd', 'IndBlend', 'Bond']]      //'StProd', 'IndBlend', 'Bond'
              .concat(statArr[0][0].map((el, ind) => [statArr[0][0][ind], statArr[0][1][ind], statArr[0][2][ind]]))}
      options={{
        chart: {
          title: "Scatter Chart",
        },
        pointSize: 4,
        chartArea: { width: "90%",
                              height: "80%", 
                              right: 10,
                              backgroundColor: "beige",
                              // right: 10,
                            },
        series: {
          0: { axis: "Ind Blend", pointsVisible: scatter[0] },
          1: { axis: "Bond", pointsVisible: scatter[1] },
        },
        hAxis: {
          title: 'StProd Return  %',  
        },
        legend: {
          position: "none",},
        
      }}
      
    />    


           
            {scatter.map((e, i) => (
            <p className = {"scat-chkbx-"+i}>
            <input
             
            key={"c"+i}
            type="checkbox"
            checked={e}
            // name= {['IndBlend', 'Bond'][i]}
            onChange={() => handleInputChangeM(i)} />
            <label className="radiolabel" >{['IndBlend', 'Bond'][i]}</label></p>
          
             ))}
           

{statArr[0].slice(4).map((ar, i) => (                                

<Chart
     chartType="Histogram"
     key = {(i+3).toString()}
     data={[['index', 'return']].concat(ar.map((el, ind) => [ind.toString(), el]))}
     options={  {title: ['Coup. Paid ', 'LifeInMonths '][i]+'distribution' ,
     //colors: ["#4285F4"],
     height: "300px",
      chartArea: { width: "90%",
                   height: "auto", 
                   backgroundColor: "beige",
                   right: 10,
                 },
     hAxis: {
       //title: 'Return',  
     },
     bar: { gap: 0 },
     histogram: {
       bucketSize: 1,
       maxNumBuckets: props.data.options.termInMonths+1,                
       //lastBucketPercentile: 0,
     }
   } }         
 /> 

))}  
                </fieldset>

      </>
    );
  
}

export default Graphs;

// statArr.slice(3)[0].map((el, ind) => [el, statArr[1][ind], statArr[2][ind]])