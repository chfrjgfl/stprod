import React, { useState } from 'react';
import './Options.css';
import StatInfo from './StatInfo.js';
import Form from './Form.js';
import Graphs from './Graphs.js';
import Raw from './Raw.js';
import {histRet} from './histRetForStProd';

const issuers = ['JPMorgan', 'Glenlivet', 'Rabinovitch'];
const issuerCredits = ['A', 'B', 'C', 'D'];
  
  function Options () {

    const [state, setState] = useState({
          options: {
            prodType: 'A',
            cusip: '12345',
            issuer: issuers[0],
            issuerCredit: issuerCredits[0],
            termInMonths: 18,
            callProtectionMonths: 3, 
            upFactor: 1.5,
            callable: true, 
            couponLow: 7.00, 
            couponHigh: 14.00,
            couponBarrier: -30,
            memory: false,
            principalBarrier: -50,
            indexes: ['S&P 500', 'NASDAQ 100', 'RUSSELL 2000'],
          },
            data: { statInfo: [],
            statArr:[],
            startDate: '',
            }
        });

        function handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
   
        setState({            
          [name]: value
        });
      }

      function handleMultInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        const ss = this.state[name];
        ss.includes(value)? ss.splice(ss.indexOf(value),1): ss.push(value);
    
        setState({
          [name]: ss
        });
      }

    const handleSubmit = async (event, options) => {

        event.preventDefault();
        alert(JSON.stringify(options));        

            const f = await fetch("/api", {
                      method: "POST", 
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(options),
                    });
        const f1 = await f.json();
            alert (`Results file: ${f1.filename}`);

            setState({options: options, data: f1.data});

      }    

   
    
  
       
      return (
      <>  
        <div className="row">
          <div className = "formdiv">
            

              <Form options = {state.options}
                    handleSubmit = {handleSubmit}  
              />

           
          </div>
          
          {(state.data.statInfo.length > 0) && <>
            <div className = "tablediv">

                <StatInfo data = {state} />
                
            </div>

            <div className = "graphdiv">

                <Graphs data = {state}/>
    
            </div>

            
            </>
          }
   
         
      </div>

      {(state.data.statArr.length > 0) && 
            <div className = "rawdiv">
{/* {this.state.options.prodType === 'A'? "rawdivnarrow": "rawdiv"} */}
            <Raw data = {state} />

            </div>
           
          }

    </>
      );
    
  }

export default Options;

