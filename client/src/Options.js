import React from 'react';
import ReactDOM from 'react-dom/client';
import './Options.css';
//import axios from 'axios';
import { read, utils, writeFile } from 'xlsx';
import StatInfo from './StatInfo.js';
import Form from './Form.js';
import Graphs from './Graphs.js';


//import {xparse} from "./nxlsx.js";

//const fs = require("fs");

const issuers = ['JPMorgan', 'Glenlivet', 'Rabinovitch'];
const issuerCredits = ['A', 'B', 'C', 'D'];
const inds = ['S&P 500', 'NASDAQ 100', 'RUSSELL 2000'];
const prodTypes = [{key:'A', type: 'Coupon'}, {key: 'B', type: 'Growth'}];



// const stProd = {
//     cusip: '12345',
//     issuer: '',
//     issuerCredit: '',
//     termInMonths: 18,
//     callProtectionMonths: 3, 
     

// };

  
  class Options extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
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
            statInfo: [],
            statArr:[],
        };

        this.responseState = {

        };
    
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleMultInputChange = this.handleMultInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
       
      }
    
      handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
   
        this.setState({            
          [name]: value
        });
      }

      handleMultInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        const ss = this.state[name];
        ss.includes(value)? ss.splice(ss.indexOf(value),1): ss.push(value);
    
        this.setState({
          [name]: ss
        });
      }

      handleSubmit = async (event, options) => {
        event.preventDefault();
        alert(JSON.stringify(options));
        this.setState({
            options: options
          });
//const sss = this.state;
//       (async() => {
            const f = await fetch("/api", {
                      method: "POST", 
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(options),
                    });
        const f1 = await f.json();
            alert (`Results file: ${f1.filename}`);

            this.setState({
              statInfo: f1.statInfo
            });

            this.setState({
                statArr: f1.statArr
              });
            
//          })(); 

      }    

   
    
    render() {
       
      return (
        <>
         <fieldset className = "form">
        <legend> Options </legend>

        <Form options = {this.state.options}
              handleSubmit = {this.handleSubmit}  
        />

        </fieldset>

        {(this.state.statInfo.length > 0) && <>

        <fieldset className = "table">
        <legend> Stats Summary </legend>

        <StatInfo statInfo = {this.state.statInfo} />
        
        </fieldset>
        
        <fieldset className = "graph">
        <legend> Graphs </legend>

        <Graphs data = {this.state}/>
        
        </fieldset>
        </>
        }

        </>
      );
    }
  }

  
  // ========================================
  
//   const root = ReactDOM.createRoot(document.getElementById("root"));
//   root.render(<Options />);

  export default Options;

