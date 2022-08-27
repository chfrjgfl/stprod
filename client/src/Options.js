import React from 'react';
import ReactDOM from 'react-dom/client';
import './Options.css';
//import axios from 'axios';
import { read, utils, writeFile } from 'xlsx';

//import {xparse} from "./nxlsx.js";

//const fs = require("fs");

const issuers = ['JPMorgan', 'SHMorgan', 'Rabinovitch'];
const issuerCredits = ['A', 'B', 'C', 'D'];
const inds = ['S&P 500', 'NASDAQ 100', 'RUSSELL 2000'];

const stProd = {
    cusip: '12345',
    issuer: '',
    issuerCredit: '',
    termInMonths: 18,
    callProtectionMonths: 3, 
     

};

  
  class Options extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            prodType: 'A',
            cusip: 'qwe',
            issuer: issuers[0],
            issuerCredit: issuerCredits[0],
            termInMonths: 18,
            callProtectionMonths: 3, 
            upFactor: 1.1,
            callable: true, 
            couponLow: 7.00, 
            couponHigh: 14.00,
            couponBarrier: -30,
            memory: false,
            principalBarrier: -50,
            indexes: ['S&P 500', 'NASDAQ 100', 'RUSSELL 2000']
        };
    
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleMultInputChange = this.handleMultInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
       
      }
    
      handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
    //    if (name === 'upFactor') value /= 10;
    
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

      handleSubmit(event) {
        event.preventDefault();
        alert(JSON.stringify(this.state));
//       const formdata = new FormData(event.currentTarget);
const sss = this.state;
       (async() => {
            const f = await fetch("/api", {
                      method: "POST", 
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(sss),
//                      mode: "no-cors"
                    });
        const f1 = await f.json();
            alert (f1);
          })(); 

        // axios.post("http://localhost:2000/", this.state, {
        // }).then(res => {
        //     console.log(res);
        // })
        //xparse ('inds.xlsx', this.state);

      }    
    
    render() {
       
      return (
        <>
        
        <form padding="5" onSubmit={this.handleSubmit} >
        
            <br/> 
            <label>Product Type:
                
                    <input type="radio" id="1" onChange={this.handleInputChange}
                    name="prodType" value="A" defaultChecked />  
                    <label htmlFor="1">A</label>

                    <input type="radio" id="2" onChange={this.handleInputChange}
                    name="prodType" value="B" />  
                    <label htmlFor="2">B</label>
               
            </label>   
            <br/>
                        

            <br/>       
            <label>CUSIP: <input    
                name = "cusip"
                type = "text"
                value = {this.state.cusip}
                onChange = {this.handleInputChange}
            ></input>
            </label>            

            <br/>
            <label>Issuer: <select    
                name = "issuer"
                value = {this.state.issuer}
                onChange = {this.handleInputChange}    
            >
                {issuers.map(item => <option>{item}</option> )}        
            </select>    
            </label>

            <br/>
            <label>IssuerCredit: <select    
                name = "issuerCredit"
                value = {this.state.issuerCredit}
                onChange = {this.handleInputChange}    
            >
                {issuerCredits.map(item => <option>{item}</option> )}
            </select>    
            </label>

            <br/>
            <label>TermInMonths: <input    
                name = "termInMonths"
                type = "number"
                min = "12"
                max = "60"
                value = {this.state.termInMonths}
                onChange = {this.handleInputChange}    
            >
            </input>    
            </label>

           
            {this.state.prodType === "A" && <label>

            <label><br/>CallProtectionMonths: <input    
                name = "callProtectionMonths"
                type = "number"
                min = "1"
                max = "10"
                value = {this.state.callProtectionMonths}
                onChange = {this.handleInputChange}    
            >    
            </input>    
            </label>

            
            <label><br/>Callable: <input
                name="callable"
                type="checkbox"
                checked={this.state.callable}
                onChange={this.handleInputChange} />
            </label>

            
            <label><br/>CouponLow: <input
                name="couponLow"
                type="number"
                min = "0"
                value={this.state.couponLow}
                onChange={this.handleInputChange} />
            </label>

            
            <label><br/>CouponHigh: <input
                name="couponHigh"
                type="number"
                min = "0"
                value={this.state.couponHigh}
                onChange={this.handleInputChange} />
            </label>

            
            <label><br/>CouponBarrier: <input
                name="couponBarrier"
                type="number"
                min = "-100"
                max = "0"
                value={this.state.couponBarrier}
                onChange={this.handleInputChange} /> %
            </label>

            
            <label><br/>Memory: <input
                name="memory"
                type="checkbox"
                checked={this.state.memory}
                onChange={this.handleInputChange} />
            </label>
            </label> }

            {this.state.prodType === "B" && <label>
            <br/>UpLevFactor: <input
                name="upFactor"
                type="number"
                min = "0"
                max = "5"
                step = "0.1"
                value={this.state.upFactor}
                onChange={this.handleInputChange}/>
            </label>}
            
            <label><br/>PrincipalBarrier: <input
                name="principalBarrier"
                type="number"
                min = "-100"
                max = "0"
                value={this.state.principalBarrier}
                onChange={this.handleInputChange} /> %
            </label>

            <br/>
            <label>Indexes: <select    
                name = "indexes"
                multiple = {true}
                size = {Math.min(inds.length, 4)}
                value = {this.state.indexes}
                onChange = {this.handleMultInputChange}    
            >
                {inds.map(item => <option >{item}</option> )}        
            </select>    
            </label>

            <br/>
            <label> <span className='mylabel'>
                {this.state.indexes.join(' - ')}
                </span>
            </label>

            <br/>
            <button type="submit" className="mybtn">Submit</button>
        </form>

        </>
      );
    }
  }

  
  // ========================================
  
//   const root = ReactDOM.createRoot(document.getElementById("root"));
//   root.render(<Options />);

  export default Options;

