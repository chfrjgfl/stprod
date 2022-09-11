const express = require("express");
const path = require('path');
const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.post("/api", (req, res) => {
    console.log((req.body));
    const r = req.body;
    if (r) {
        let s = main(r);
        res.json(s);
    }
  });

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });  

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const XLSX = require("xlsx");
const stats = require('simple-statistics')
const inputFile = __dirname+ '\\xlsx\\StProds.xlsx';
const dbFile = __dirname+ '\\xlsx\\HistRetForStProd.xlsx';

function main(terms) {
//remakeHistData(__dirname+ '\\xlsx\\HistRetForStProd.xlsx');
const stProd = terms;//xparse(inputFile);


//Array.prototype.push.apply(outputHeader, stProd.inds.map(el => 'Return '+el));
 //		BondTR			MemoryCouponsPaid		ReturnIndex	ReturnIndex2	ReturnIndex3	ReturnIndex…ETC	called matured Date

console.log(JSON.stringify(stProd));
const histData = getHistData(dbFile, stProd.indexes);
return calcRTPs(stProd, histData); 
}
//----------------------------------------
function xparse (file) {
    const wb = XLSX.readFile(file)
    const ws = wb.Sheets[wb.SheetNames[0]];
    const terms = XLSX.utils.sheet_to_json(ws, {range: "A1:G2"})[0];
    terms.inds = XLSX.utils.sheet_to_json(ws, {header:1, range: "H2:M2"})[0];

    return terms;    
}
//-----------------------------------------
function getHistData(file, inds) {
    const wb = XLSX.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const ss = XLSX.utils.decode_range(ws['!ref']);
    const arr = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    const res = {
        dates: XLSX.utils.sheet_to_json(ws, {header:1, range: ws['!ref'].replace(/\d+$/, '1')})[0]
                .slice(2).map(el => (el.match(/\d{4}-\d{2}/)||[])[0]),
        indArray: [],
        indCumulArray: [],
        start: [2000, 2000],
        bondArray:[2, ''],
        bondStart:-1
    }

    let n = 1;
    while(res.bondStart < 0 || n < ss.e.r+1) {
        if ((arr[n][0]) === 'AGG cumul.') {
            res.bondStart = n;
            Array.prototype.push.apply(res.bondArray, arr[n].slice(2));
        }
        n++;
    }

    for (let i=0; i<inds.length; i++) {                 // find rows for PR & TR inds
        const ab = [];
        const ac = [];
        for (let k=0; k<2; k++) {                   // 0 for pr, 1 for tr
                           
            let s = inds[i].toUpperCase()+[" PR", " TR"][k];
            if (s == 'S&P 500 TR') s = 'SPX TR';
            
            for (let j=1; j<=ss.e.r; j++) {

                // const aa = [];
                // const ad = [];
                if (arr[j][0].toUpperCase().includes(s)) {
                   
                    const aa = [arr[j].slice(2).findIndex(el => typeof el == 'number')+2, ''];
                    res.start[k] = Math.min(res.start[k], aa[0]);
                    Array.prototype.push.apply(aa, arr[j].slice(2));
                    const ad = aa.slice(0, aa[0]);
                //    ad[aa[0]] = aa[aa[0]];
                    for (let m=aa[0]; m<aa.length; m++) {
                        ad[m] = toPercent(toFraction(ad[m-1])*toFraction(aa[m]));
                    }                   

                    ab.push(aa);
                    ac.push(ad);

                    j = ss.e.r+1;
                }
            }
        }
        res.indArray.push(ab);
        res.indCumulArray.push(ac);
    }
   
    return res;    
}
//-------------------------------------------------
function calcRTPs (stProd, histData) {

    const outputHeader = [
        'CUSIP',
        'American/European',
        'Issuer',
        'IssuerCredit',
        'StartDate',
        'EndDate'].concat(stProd.indexes.map(el => `Return ${el} PR`),
                        ['StProd(w/crnt-terms)',
                        'EqAmongIndexesTR',
                        'Bond TR'],
            stProd.prodType === 'A'?['NumberMissedCoupons',
                        'NumberCouponPaid',
                        'LifeInMonths',
                        'Called Date']: [],
                        stProd.indexes.map(el => `Return ${el} TR`),
                        [''],
                        stProd.indexes.map(el => `Monthly ${el} PR`),
                        stProd.indexes.map(el => `Monthly ${el} TR`));                    

    const res = [];
    const term = stProd.termInMonths;
    const principalBarrier = stProd.principalBarrier;//-100);//*100; 
    const histLen = histData.bondArray.length;
    const callPrMonths = stProd.callable? stProd.callProtectionMonths: 0;
    const couponLow = stProd.couponLow;
    const couponBarrier = stProd.couponBarrier;//-100);//*100;
   
    const wsNew = XLSX.utils.aoa_to_sheet([outputHeader]);
  
    for (let i=histData.start[0]; i<histLen-term; i++) {        //от начала первого из индексов
        let t = Math.min(term, histLen-i);          // длительность периода

        const o = {
            startDate: histData.dates[i-2],
            couponPaid: callPrMonths-1,
            couponMissed:0,
           called: false,
            matured: false,
            lifeInMonths: t,
            eqIndReturn: 0,
            indReturnPR:[],
            indReturnTR:[],
            
        }; 
        o.endDate = histData.dates[i-3+t];
        let worst;
              
        for (let j=i+callPrMonths-1; j<i+t; j++) {    // from callPr till endDate - RTP for stProd
            if (stProd.prodType === 'B') j = i+t-1;      
                o.indReturnPR = histData.indCumulArray.map(el => (j<el[0][0])? '':
                +toPercent(toFraction(el[0][j])/toFraction(el[0][i-1])).toFixed(2));
                worst = o.indReturnPR
                    .reduce((a,b) => (typeof b === 'number'&& b<a)? b:a, 1000);     //worst index from beginning of RTP
                    
        if (stProd.prodType === 'A') {    
               worst < couponBarrier? o.couponMissed ++: o.couponPaid ++;                    
                 o.called = (worst>0);
                 if(o.called) {
                     o.lifeInMonths = j-i+1;
                     j = i+t;
                 }
                
            } 
        }

        if (stProd.prodType === 'A') {
            o.matured = (o.lifeInMonths == term);
            o.returnOfSP = o.couponPaid*couponLow/12 + ((o.matured && (worst < principalBarrier))? worst: 0);
        } else {
            o.returnOfSP = worst > 0? worst*stProd.upFactor: 
                    worst < principalBarrier? worst: 0;
        }
        o.returnOfSP = +o.returnOfSP.toFixed(2);

o.bondReturn = +toPercent(toFraction(histData.bondArray[i + o.lifeInMonths-1])/toFraction(histData.bondArray[i-1])).toFixed(2);

        o.indReturnTR = histData.indCumulArray.map(el => (i<el[1][0])? '': 
                +toPercent(toFraction(el[1][i + o.lifeInMonths-1])/toFraction(el[1][i])).toFixed(2));
        let x = o.indReturnTR.reduce((a, b) => a += (typeof b === 'number')? 1: 0, 0);
        o.eqIndReturn = +o.indReturnTR.reduce((a,b) => a+(b||0)/x, 0).toFixed(2);


        // if (i >= histData.start[1]) {}
        //     o.indReturnTR = histData.indCumulArray.map(el => (i<el[1][0])? '': 
        //         toPercent(toFraction(el[1][i + o.lifeInMonths-1])/toFraction(el[1][i])));
        //     let x = o.indReturnTR.filter(el => el).length;
        //     o.eqIndReturn = o.indReturnTR.reduce((a,b) => a+(b||0)/x, 0);
        //     fromO[7+o.indReturnPR.length] = o.eqIndReturn;
        //     Array.prototype.push.apply(fromO, o.indReturnTR);        
        // } 

        const fromO = ['', '', '', '', o.startDate, o.endDate]
        .concat(o.indReturnPR, [
                                o.returnOfSP,
                                o.eqIndReturn,
                                o.bondReturn],
                stProd.prodType === 'A'? [
                    o.couponMissed,
                    o.couponPaid,
                    o.lifeInMonths,
                    o.lifeInMonths < 18? histData.dates[i + o.lifeInMonths-3]: '']: [],
                                o.indReturnTR,
                                [''],
                                histData.indArray.map(el => i<el[0][0]? '': +el[0][i].toFixed(2)),
                                histData.indArray.map(el => i<el[1][0]? '': +el[1][i].toFixed(2)));
    //            .map(a => typeof a === 'number' && !Number.isInteger(a)? +a.toFixed(2): a);


        // const fromO = ['', '', '', '', o.startDate, o.endDate]
        // .concat(o.indReturnPR, [
        //                         o.returnOfSP,
        //                         '',
        //                         o.bondReturn,
        //                         o.couponMissed,
        //                         o.couponPaid,
        //                         o.lifeInMonths,
        //                         o.lifeInMonths < 18? histData.dates[i + o.lifeInMonths-3]: '']);                        

                       
        XLSX.utils.sheet_add_aoa(wsNew, [fromO], {origin: -1}); 

        res.push(o);
    }
const maxArr = [0, 0, 0];
const betterArr = [0, 0, 0];
for (let el of res) {
    const ar = [el.returnOfSP, el.eqIndReturn, el.bondReturn];
    maxArr[ar.indexOf(stats.max(ar))] ++;
    for (let m = 1; m<3; m++ ) {
        if (ar[0] > ar[m]) betterArr[m] ++;
    }
}

const statArr = [];
statArr.push(res.map(el => el.returnOfSP).sort((a,b)=>a-b), res.map(el => el.eqIndReturn).sort((a,b)=>a-b), 
        res.map(el => el.bondReturn).sort((a,b)=>a-b));   

if (stProd.prodType === 'A') {
    statArr.push(res.map(el => el.couponMissed).sort((a,b)=>a-b), res.map(el => el.couponPaid).sort((a,b)=>a-b),
            res.map(el => el.lifeInMonths).sort((a,b)=>a-b));

}

// console.log(statArr);
// for (let el of statArr) {console.log ((el.findLastIndex( a => a < 0) + 1) * 100 / el.length)};

const statInfo = [
    {fname: '% The Best Perf.', array: maxArr.map(el => +(el*100/res.length).toFixed(2))},
    {fname: '% StProd Better Than:', array: betterArr.map(el => +(el*100/res.length).toFixed(2))},
    {fname: 'Minimum', array: statArr.map(el => stats.minSorted(el))},
    {fname: 'Maximum', array: statArr.map(el => stats.maxSorted(el))},
    {fname: 'Mean', array: statArr.map(el =>  +stats.mean(el).toFixed(2))},
    {fname: 'Mode', array: statArr.map(el => stats.modeSorted(el))},
    {fname: 'Median', array: statArr.map(el => stats.medianSorted(el))},
    {fname: 'Root Mean Square', array: statArr.map(el => +stats.rootMeanSquare(el).toFixed(2))},
    {fname: 'SampleSkewness', array: statArr.map(el => +stats.sampleSkewness(el).toFixed(2))},
    {fname: 'Variance', array: statArr.map(el => +stats.variance(el).toFixed(2))},
    {fname: 'Standard Deviation', array: statArr.map(el => +stats.standardDeviation(el).toFixed(2))},
    {fname: 'MedianAbsoluteDeviation', array: statArr.map(el => +stats.medianAbsoluteDeviation(el).toFixed(2))},
    {fname: '% Negative', array: statArr.map(el =>  +((el.findLastIndex( a => a < 0) + 1) * 100 / el.length).toFixed(2))},

];

for(let m = 1; m < 11; m ++) {            
    statInfo.push({fname: m + '0th Percentile', array: statArr.map(el => stats.quantileSorted(el, m/10))});
            
    if(m == 8) {
        statInfo.push({fname: '83.35th Percentile', array: statArr.map(el => stats.quantileSorted(el, 0.8335))});
    }  
                
}  

for (let a of statInfo) {
    XLSX.utils.sheet_add_aoa(wsNew, [[a.fname,,,,,,,,''].concat(a.array)], {origin: -1}); 
}


    // XLSX.utils.sheet_add_aoa(wsNew, [
    //     ['% Outperforms',,,,,,,,''].concat(maxArr.map(el => +(el*100/res.length).toFixed(2))),
    //     ['Minimum',,,,,,,,''].concat(statArr.map(el => stats.minSorted(el))),
    //     ['Maximum',,,,,,,,''].concat(statArr.map(el => stats.maxSorted(el))),
    //     ['Mean',,,,,,,,''].concat(statArr.map(el => +stats.mean(el).toFixed(2))),
    //     ['Mode',,,,,,,,''].concat(statArr.map(el => stats.modeSorted(el))),
    //     ['Median',,,,,,,,''].concat(statArr.map(el => stats.medianSorted(el))),
    //     ['Root Mean Square',,,,,,,,''].concat(statArr.map(el => +stats.rootMeanSquare(el).toFixed(2))),
    //     ['SampleSkewness',,,,,,,,''].concat(statArr.map(el => +stats.sampleSkewness(el).toFixed(2))),
    //     ['Variance',,,,,,,,''].concat(statArr.map(el => +stats.variance(el).toFixed(2))),
    //     ['Standard Deviation',,,,,,,,''].concat(statArr.map(el => +stats.standardDeviation(el).toFixed(2))),
    //     ['MedianAbsoluteDeviation',,,,,,,,''].concat(statArr.map(el => stats.medianAbsoluteDeviation(el))),
    //     ['% Negative',,,,,,,,''].concat(statArr.map(el => +((el.findLastIndex( a => a < 0) + 1) * 100 / el.length).toFixed(2))),

    //         ], {origin: -1});   

    // for(let m = 1; m<11; m++) {            
    //     XLSX.utils.sheet_add_aoa(wsNew, [
    //         [`${m}0th Percentile`,,,,,,,,''].concat(statArr.map(el => stats.quantileSorted(el, m/10)))
    //             ], {origin: -1}); 
    //     if(m == 8) {
    //         XLSX.utils.sheet_add_aoa(wsNew, [
    //             ['83.35th Percentile',,,,,,,,''].concat(statArr.map(el => stats.quantileSorted(el, 0.8335)))    
    //                 ], {origin: -1}); 
    //     }  
                    
    // }        

    XLSX.utils.sheet_add_aoa(wsNew, [[stProd.cusip, 
                                        stProd['American/European'],
                                        stProd.issuer,
                                        stProd.issuerCredit]], {origin: 'A2'});
    
   
        const wbNew = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbNew, wsNew, stProd.cusip);
let fileOK = true;
let filename = stProd.cusip; ;
do {
    try { XLSX.writeFile(wbNew, __dirname + '\\xlsx\\' + filename + '.xlsx');
        fileOK = true;
    } catch {
        filename += '-1';
        fileOK = false;
     }
} while (!fileOK);
   return {filename: __dirname + '\\xlsx\\' + filename + '.xlsx', statInfo: statInfo};    
}

//---------------------------------------------------
function toFraction(percent) {
    percent = percent || 0;
    return 1 + percent/100;
}

function toPercent(fraction) {
    fraction = fraction || 0;
    return (fraction-1)*100;
}

//---------------------------------------------
function remakeHistData(file) {
    const wb = XLSX.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const ss = XLSX.utils.decode_range(ws['!ref']);    

    const arr = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const wsNew = XLSX.utils.aoa_to_sheet([arr[0]]);

    for (let i = 1; i<ss.e.r; i++) {
        const cums = [arr[i][0]+' cum.'];
        const adds = [arr[i][0]+' add.'];
        for (let j = 3; j<=ss.e.c; j++) {
            if(typeof arr[i][j] == 'number') {
                cums[j] = toPercent(toFraction(arr[i][j])*toFraction(cums[j-1]));
                adds[j] = arr[i][j] + (adds[j-1] || 0);
            }
        }
        XLSX.utils.sheet_add_aoa(wsNew, [arr[i], cums, adds], {origin: -1});    
    }
    const wbNew = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbNew, wsNew, wb.SheetNames[0]);
    XLSX.writeFile(wbNew, __dirname+ '\\xlsx\\HistRetForStProdNew.xlsx');
}
    

function writeExcel(data, fileName) {
    let wb = XLSX.utils.book_new(); 
    let ws = XLSX.utils.aoa_to_sheet(data); 
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${__dirname}/${fileName}`, {bookType: "biff8"});
     console.log(`${fileName} ready`);
}

function calcDate(date, n) {
    let m = + date.slice(-2);
    let y = + date.slice(0,4);
    m += n;
    while (m>12) {
        y++;
        m -= 12;
    }
    while (m<1) {
        y--;
        m += 12;
    }
    if (m<10) m='0'+m;
    return[y, m].join('-');
}