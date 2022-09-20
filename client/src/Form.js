import React, { useState } from 'react';
//import ReactDOM from 'react-dom/client';
//import './StatInfo.css';
import './Options.css';

const issuers = ['JPMorgan', 'Glenlivet', 'Rabinovitch'];
const issuerCredits = ['A', 'B', 'C', 'D'];
const inds = ['S&P 500', 'NASDAQ 100', 'RUSSELL 2000'];
const prodTypes = [{key:'A', type: 'Coupon'}, {key: 'B', type: 'Growth'}];


function Form (props) {
//    const opts  = props.options;
    const [opts, setOpts] = useState(props.options);


    function handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
   
        setOpts({
            ...opts, [name]: value
          });
        
      }

      function handleMultInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        const ss = opts[name];
        ss.includes(value)? ss.splice(ss.indexOf(value),1): ss.push(value);
    
        setOpts({
          ...opts, [name]: ss
        });
      }

//     function handleSubmit(event) {
//       props.handleSubmit(opts);
//    }

    return (
     
      <fieldset className = "form">
              <legend> Options </legend>
      <form padding="5"  >
        
        <br/> 
        <label>Product Type:

              {prodTypes.map((el, i) => (
                <>
                <input type="radio" id={(i + 1).toString()} onChange={e => handleInputChange(e)}
                  name="prodType" value={el.key} key={el.key} defaultChecked={i===0}/>
                  <label className="radiolabel" htmlFor={`${i + 1}`}>{el.type}</label>
                  </>
              ))}
                           
        </label>   
        <br/>
                    

        <br/>       
        <label>CUSIP: <input    
            name = "cusip"
            key = "cusip"
            type = "text"
            value = {opts.cusip}
            onChange = {event => handleInputChange(event)}
        ></input>
        </label>            

        <br/>
        <label>Issuer: <select    
            name = "issuer"
            key = "issuer"
            value = {opts.issuer}
            onChange = {event => handleInputChange(event)}    
        >
            {issuers.map(item => <option key={item}>{item}</option> )}        
        </select>    
        </label>

        <br/>
        <label>IssuerCredit: <select    
            name = "issuerCredit"
            key = "issuerCredit"
            value = {opts.issuerCredit}
            onChange = {event => handleInputChange(event)}    
        >
            {issuerCredits.map(item => <option key={item}>{item}</option> )}
        </select>    
        </label>

        <br/>
        <label>TermInMonths: <input    
            name = "termInMonths"
            key = "termInMonths"
            type = "number"
            min = "12"
            max = "60"
            value = {opts.termInMonths}
            onChange = {event => handleInputChange(event)}    
        >
        </input>    
        </label>

       
        {opts.prodType === "A" && <>

        <label><br/>CallProtectionMonths: <input    
            name = "callProtectionMonths"
            key = "callProtectionMonths"
            type = "number"
            min = "1"
            max = "10"
            value = {opts.callProtectionMonths}
            onChange = {event => handleInputChange(event)}    
        >    
        </input>    
        </label>

        
        <label><br/>Callable: <input
            name="callable"
            key="callable"
            type="checkbox"
            checked={opts.callable}
            onChange={event => handleInputChange(event)} />
        </label>

        
        <label><br/>CouponLow: <input
            name="couponLow"
            key="couponLow"
            type="number"
            min = "0"
            value={opts.couponLow}
            onChange={event => handleInputChange(event)} />
        </label>

        
        <label><br/>CouponHigh: <input
            name="couponHigh"
            key="couponHigh"
            type="number"
            min = "0"
            value={opts.couponHigh}
            onChange={event => handleInputChange(event)} />
        </label>

        
        <label><br/>CouponBarrier: <input
            name="couponBarrier"
            key="couponBarrier"
            type="number"
            min = "-100"
            max = "0"
            value={opts.couponBarrier}
            onChange={event => handleInputChange(event)} /> %
        </label>

        
        <label><br/>Memory: <input
            name="memory"
            key="memory"
            type="checkbox"
            checked={opts.memory}
            onChange={event => handleInputChange(event)} />
        </label>
        </> }

        {opts.prodType === "B" && <label>
        <br/>UpLevFactor: <input
            name="upFactor"
            key="upFactor"
            type="number"
            min = "0"
            max = "5"
            step = "0.1"
            value={opts.upFactor}
            onChange={event => handleInputChange(event)}/>
        </label>}
        
        <label><br/>PrincipalBarrier: <input
            name="principalBarrier"
            key="principalBarrier"
            type="number"
            min = "-100"
            max = "0"
            value={opts.principalBarrier}
            onChange={event => handleInputChange(event)} /> %
        </label>

        <br/>
        <label>Indexes: <select    
            name = "indexes"
            key = "indexes"
            multiple = {true}
            size = {Math.min(inds.length, 4)}
            value = {opts.indexes}
            onChange = {event => handleMultInputChange(event)}    
        >
            {inds.map(item => <option key={item}>{item}</option> )}        
        </select>    
        </label>

        <br/>
        <label> <span className='mylabel' key = "inds">            
            {opts.indexes.join(' - ')}
            </span>
        </label>

        <br/>
        <button type="submit" className="mybtn" key = "btn" onClick={event => props.handleSubmit(event, opts)}>Submit</button>
    </form>
    </fieldset>
   
    );
  
}



export default Form;