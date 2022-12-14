
const express = require("express");
const path = require('path');
const PORT = process.env.PORT || 3001;
const {KalmanFilter} = require('kalman-filter');

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

    const pType = stProd.prodType;
    const outputHeader = [
        'CUSIP',
        'American/European',
        'Issuer',
        'IssuerCredit',
        'StartDate',
        'EndDate'].concat(stProd.indexes.map(el => `Return ${el} PR`),
                        ['StProd(w/crnt-terms)',
                        'Ind Blend TR',
                        'Bond TR'],
                        pType === 'A'?['NumberMissedCoupons',
                        'NumberCouponPaid',
                        'LifeInMonths',
                        'Called Date']: [],
                        stProd.indexes.map(el => `Return ${el} TR`),
                        [''],
                        stProd.indexes.map(el => `Monthly ${el} PR`),
                        stProd.indexes.map(el => `Monthly ${el} TR`),
                        ['Ann\'d StProd',
                        'Ann\'d IndBlend',
                        'Ann\'d Bond']
                        );                    

    const res = [];
    const term = +stProd.termInMonths;
    const principalBarrier = stProd.principalBarrier;//-100);//*100; 
    const histLen = histData.bondArray.length;
    const callPrMonths = stProd.callable? stProd.callProtectionMonths: 0;
    const couponLow = stProd.couponLow;
    const couponBarrier = stProd.couponBarrier;//-100);//*100;
    const memory = stProd.memory;
    
    const wsNew = XLSX.utils.aoa_to_sheet([outputHeader]);
    //const startDate = 
    const worstArr = [];
    const term0 = pType == 'A'? callPrMonths: term;
    
    for (let i=histData.start[0]; i<=histLen-term0; i++) {        //от начала первого из индексов
        let t = Math.min(term, histLen-i);          // длительность периода

        const o = {
            startDate: histData.dates[i-2],
            couponPaid: callPrMonths-1,
            couponMissed:0,
            called: false,
            matured: false,
            lifeInMonths: pType === 'A'? t: term,
            eqIndReturn: 0,
            indReturnPR:[],
            indReturnTR:[],
            activeInds: 0,

        }; 
        o.endDate = calcDate(o.startDate, term);
        let worst;
              
        for (let j=i+callPrMonths-1; j<i+t; j++) {    // from callPr till endDate - RTP for stProd
            if (pType === 'B') j = i+t-1;      
                o.indReturnPR = histData.indCumulArray.map(el => (j<el[0][0])? '':
                +toPercent(toFraction(el[0][j])/toFraction(el[0][i-1])).toFixed(2));
                worst = o.indReturnPR
                    .reduce((a,b) => (typeof b === 'number'&& b<a)? b:a, 1000);     //worst index from beginning of RTP
                    
        if (pType === 'A') {    
              if (memory) {
                if (worst < couponBarrier) {
                    o.couponMissed ++;
                    } else {
                        o.couponPaid += 1 + o.couponMissed;
                        o.couponMissed = 0;
                        }

              } else worst < couponBarrier? o.couponMissed ++: o.couponPaid ++;                    
                 if (worst>0)
                  { 
                    o.lifeInMonths = j-i+1;
                    j = i+t;
                    o.called = o.lifeInMonths < term;
                 }
                
            } 
        }

        if (pType === 'A') {
            o.matured = (o.lifeInMonths == term);
            
            o.returnOfSP = o.couponPaid*couponLow/12 + ((o.matured && (worst < principalBarrier))? worst: 0);
        } else {
            o.returnOfSP = worst > 0? worst*stProd.upFactor: 
                    worst < principalBarrier? worst: 0;
        }
        o.returnOfSP = +o.returnOfSP.toFixed(2);

o.bondReturn = +toPercent(toFraction(histData.bondArray[i + o.lifeInMonths-1])/toFraction(histData.bondArray[i-1])).toFixed(2);

        o.indReturnTR = histData.indCumulArray.map(el => (i<el[1][0])? '': 
                +toPercent(toFraction(el[1][i + o.lifeInMonths-1])/toFraction(el[1][i-1])).toFixed(2));
        o.activeInds = o.indReturnTR.reduce((a, b) => a += (typeof b === 'number')? 1: 0, 0);
        o.eqIndReturn = +o.indReturnTR.reduce((a,b) => a+(b||0)/o.activeInds, 0).toFixed(2);

        const fromO = ['', '', '', '', o.startDate, o.endDate]
        .concat(o.indReturnPR, [
                                o.returnOfSP,
                                o.eqIndReturn,
                                o.bondReturn],
                                pType === 'A'? [
                    o.couponMissed,
                    o.couponPaid,
                    o.lifeInMonths,
                    o.called? histData.dates[i + o.lifeInMonths-3]: '']: [],
                                o.indReturnTR,
                                [''],
                                histData.indArray.map(el => i<el[0][0]? '': +el[0][i].toFixed(2)),
                                histData.indArray.map(el => i<el[1][0]? '': +el[1][i].toFixed(2)),
                                [pType === 'A'? o.returnOfSP*12/o.lifeInMonths: annualized(o.returnOfSP, o.lifeInMonths),
                                 annualized(o.eqIndReturn, o.lifeInMonths),
                                 annualized(o.bondReturn, o.lifeInMonths)]
                                 );

                       
        XLSX.utils.sheet_add_aoa(wsNew, [fromO], {origin: -1}); 
    worstArr.push(worst);
        res.push(o);
    }

    const indAct = [0, res.findIndex(el => el.activeInds == 3)];

    const statArr = [];

    
    const maxArr = [[0, 0, 0], [0, 0, 0]];
    const betterArr = [[0, 0, 0], [0, 0, 0]];
    for (let el of res) {
        const ar = [el.returnOfSP, el.eqIndReturn, el.bondReturn];
        let j = res.indexOf(el);
        for (let i of [0, 1]) {
            if (j >= indAct[i]) {
                maxArr[i][ar.indexOf(stats.max(ar))] ++;
                for (let m of [1, 2] ) {
                    if (ar[0] > ar[m]) betterArr[i][m] ++;
                }
            }
        }
    }
    
//.sort((a,b)=>a-b)
        statArr.push(res.map(el => el.returnOfSP), res.map(el => el.eqIndReturn), 
            res.map(el => el.bondReturn));   

        if (pType === 'A') {
        statArr.push(res.map(el => el.couponMissed), res.map(el => el.couponPaid),
                res.map(el => el.lifeInMonths));
        }

        const statArrFrac = statArr.slice(0, 3).map((el) => el.map(a => toFraction(a)));

        const statArrSorted = indAct.map(ind => statArr.map((el) => el.slice(ind).sort((a, b) => a - b)));
        const aboveArr = [];

const statInfo = [];

for (let i of [0, 1]) {
    const ar = [
        {fname: '% Outperforms', 
            array: maxArr[i].map(el => +(el*100/(res.length - indAct[i])).toFixed(2))},
        {fname: '% StProd Better Than:', 
            array: betterArr[i].map(el => +(el*100/(res.length - indAct[i])).toFixed(2))},
        {fname: 'Minimum', 
            array: statArr.map(el => stats.min(el.slice(indAct[i])))},
        {fname: 'Maximum', 
            array: statArr.map(el => stats.max(el.slice(indAct[i])))},
        {fname: 'Mean', 
            array: statArr.map(el =>  +stats.mean(el.slice(indAct[i])).toFixed(2))},
        {fname: 'Mode', 
            array: statArr.map(el => stats.mode(el.slice(indAct[i])))},
        {fname: 'Median', 
            array: statArr.map(el => +stats.median(el.slice(indAct[i])).toFixed(2))},
        {fname: 'Geometric Mean', 
            array: statArrFrac.map(el => +toPercent(stats.geometricMean(el.slice(indAct[i]))).toFixed(2))},    
        {fname: 'Harmonic Mean', 
            array: statArrFrac.map(el => +toPercent(stats.harmonicMean(el.slice(indAct[i]))).toFixed(2))},    
        {fname: 'Root Mean Square', 
            array: statArrFrac.map(el => +toPercent(stats.rootMeanSquare(el.slice(indAct[i]))).toFixed(2))},    
        {fname: 'SampleSkewness', 
            array: statArr.map(el => +stats.sampleSkewness(el.slice(indAct[i])).toFixed(2))},
        {fname: 'Variance', 
            array: statArrFrac.map(el => +(10000*stats.variance(el.slice(indAct[i]))).toFixed(2))},
        {fname: 'Standard Deviation', 
            array: statArrFrac.map(el => +(100*stats.standardDeviation(el.slice(indAct[i]))).toFixed(2))},
        {fname: 'MedianAbsoluteDeviation', 
            array: statArrFrac.map(el => +(100*stats.medianAbsoluteDeviation(el.slice(indAct[i]))).toFixed(2))},
        {fname: '% Negative', 
            array: statArr.map(el => +((el.slice(indAct[i])
                                          .sort((a, b) => a - b)
                                          .findLastIndex( a => a < 0) + 1) * 100 / (el.length - indAct[i]))
                                          .toFixed(2))},

    ];

    let max90;
    const br = []; 

    for(let m = 1; m < 11; m ++) {            
        ar.push({fname: m + '0th Percentile', array: statArr.map(el => +stats.quantile(el.slice(indAct[i]), m/10).toFixed(2))});
                
        if(m == 8) {
            ar.push({fname: '83.35th Percentile', array: statArr.map(el => stats.quantile(el.slice(indAct[i]), 0.8335))});
        }  

        if(m == 9) max90 = Math.max.apply(null, ar[ar.length-1].array.slice(0, 3))/20;
                    
    }  

    for (let a of ar) {
        XLSX.utils.sheet_add_aoa(wsNew, [[a.fname+['', ' (3 Ind Act)'][i],,,,,,,,''].concat(a.array)], {origin: -1}); 
    }

    statInfo.push(ar);

    for (let j=0; j<21; j++) {
        let m = Math.ceil(j*max90);
        br.push([m].concat(statArrSorted[i].slice(0, 3).map(a => +((1 - findI(a, m)/a.length)*100).toFixed(2))));
    }
    aboveArr.push(br); 
}



 
XLSX.utils.sheet_add_aoa(wsNew, [[stProd.cusip, 
                                stProd['American/European'],
                                stProd.issuer,
                                stProd.issuerCredit]], {origin: 'A2'});
    
   
        const wbNew = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbNew, wsNew, stProd.cusip);
let fileOK = false;
let filename = stProd.cusip; 
let fullFileName = '';
// if (filename)     
//     while (!fileOK) {
//     fullFileName = __dirname + '\\xlsx\\' + filename + '.xlsx';
//     try { XLSX.writeFile(wbNew,fullFileName);
//         fileOK = true;
//     } catch {
//         filename += '-1';
//         fileOK = false;
//      }
// } 
const histPRArr = histData.indArray.map(el=>el[0].slice(2));
 

    const kFilter = new KalmanFilter();
    // let observation = histPRArr[0];
     const kalmanArr = [0]; //kFilter.filterAll(observation).flat();
     const meanArr = [0];
    
    let previousCorrected = null;
    let accum = 0;
    //const results = [];
    histPRArr[0].forEach((observation, ind) => {
        const predicted = kFilter.predict({
            previousCorrected
        });
    
         const correctedState = kFilter.correct({
            predicted,
            observation
        });
    
        kalmanArr.push(correctedState.mean[0][0]);
    
        // update the previousCorrected for next loop iteration
        previousCorrected = correctedState

        accum += observation;
        if (ind>3) accum -= histPRArr[0][ind-4];
        meanArr.push(accum/(4));
    });


   return {filename: fullFileName, 
    data: {statInfo: statInfo, 
            statArr: [statArr, statArr.map(el => el.slice(indAct[1]))], 
            aboveArr: aboveArr,
            startDate: histData.dates[0],
            worstArr: worstArr,
            histPRArr: histPRArr,
            kalmanArr: kalmanArr,
            meanArr: meanArr
        }};    
}

//---------------------------------------------------

function findI (arr, m) {
    let x = arr.findIndex(el => el > m);
    if (x == -1) x = arr.length;
    return x;
}

function arrSort(arr) {
    return qqq = arr.map(el => el.map(e => e.sort((a, b) => a - b)));
}

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
    if (m<10) m='0' + m;
    return[y, m].join('-');
}

function annualized(ret, term) {
    return +toPercent(Math.pow(toFraction(ret), 12/term)).toFixed(2);
}