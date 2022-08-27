const XLSX = require("xlsx");
const stats = require('simple-statistics')
const inputFile = __dirname+ '\\xlsx\\StProds.xlsx';
const dbFile = __dirname+ '\\xlsx\\HistRetForStProd.xlsx';

//remakeHistData(__dirname+ '\\xlsx\\HistRetForStProd.xlsx');
const stProd = xparse(inputFile);

const outputHeader = [
    'CUSIP',
    'American/European',
    'Issuer',
    'IssuerCredit',
    'StartDate',
    'EndDate'].concat(stProd.inds.map(el => `Return ${el} PR`),
                    ['StProd(w/crnt-terms)',
                    'EqAmongIndexesTR',
                    'Bond TR',
                    'NumberMissedCoupons',
                    'NumberCouponPaid',
                    'LifeInMonths',
                    'Called Date'],
                    stProd.inds.map(el => `Return ${el} TR`));
//Array.prototype.push.apply(outputHeader, stProd.inds.map(el => 'Return '+el));
 //		BondTR			MemoryCouponsPaid		ReturnIndex	ReturnIndex2	ReturnIndex3	ReturnIndex…ETC	called matured Date

console.log(JSON.stringify(stProd));
const histData = getHistData(dbFile, stProd.inds);
calcRTPs(); 

//----------------------------------------
function xparse (file) {
    const wb = XLSX.readFile(file)
    const ws = wb.Sheets[wb.SheetNames[0]];
    const terms = XLSX.utils.sheet_to_json(ws, {range: "A1:L2"})[0];
    terms.inds = XLSX.utils.sheet_to_json(ws, {header:1, range: "M2:V2"})[0];

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
function calcRTPs () {

    const res = [];
    const term = stProd.TermInMonths;
    const callPrMonths = stProd.Callable.toLowerCase() ==='yes'? stProd.CallProtectionMonths: 0;
    const couponLow = stProd.CouponLow;
    const couponBarrier = (stProd.CouponBarrier-1)*100;
    const principalBarrier = (stProd.PrincipalBarrier-1)*100; 
    const histLen = histData.bondArray.length;

    //CUSIP	American/European	Issuer	IssuerCredit		EndDate	StProd(w/crnt-terms)	EqAmongIndexesTR	BondTR			MemoryCouponsPaid		ReturnIndex	ReturnIndex2	ReturnIndex3	ReturnIndex…ETC	called matured Date
   
    const wsNew = XLSX.utils.aoa_to_sheet([outputHeader]);
  
    for (let i=histData.start[0]; i<histLen-callPrMonths; i++) {        //от начала первого из индексов
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
        o.endDate = (t==term)? histData.dates[i-3+t]: calcDate(o.startDate, term-1);
        let worst;
                
        for (let j=i+callPrMonths-1; j<i+t; j++) {    // from callPr till endDate - RTP for stProd
            
                o.indReturnPR = histData.indCumulArray.map(el => (j<el[0][0])? '':
                toPercent(toFraction(el[0][j])/toFraction(el[0][i-1])));
                worst = o.indReturnPR
                    .reduce((a,b) => (typeof b === 'number'&& b<a)? b:a, 100);     //worst index from beginning of RTP
                
                worst < couponBarrier? o.couponMissed ++: o.couponPaid ++;                    
                o.called = (worst>0);
                if(o.called) {
//                    o.endDate = histData.dates[j-1];
                    o.lifeInMonths = j-i+1;
                    j = i+t;
                }
                
            
        }
        o.matured = (o.lifeInMonths == term);
        o.returnOfSP = o.couponPaid*couponLow/12 + ((o.matured && (worst < principalBarrier))? worst: 0);
        o.bondReturn = toPercent(toFraction(histData.bondArray[i + o.lifeInMonths-1])/toFraction(histData.bondArray[i-1]));

        const fromO = ['', '', '', '', o.startDate, o.endDate]
        .concat(o.indReturnPR, [
                                o.returnOfSP,
                                '',
                                o.bondReturn,
                                o.couponMissed,
                                o.couponPaid,
                                o.lifeInMonths,
                                o.lifeInMonths < 18? histData.dates[i + o.lifeInMonths-3]: '']);

 
        if (i >= histData.start[1]) {
            o.indReturnTR = histData.indCumulArray.map(el => (i<el[1][0])? '': 
                toPercent(toFraction(el[1][i + o.lifeInMonths-1])/toFraction(el[1][i])));
            let x = o.indReturnTR.filter(el => el).length;
            o.eqIndReturn = o.indReturnTR.reduce((a,b) => a+(b||0)/x, 0);
            fromO[7+o.indReturnPR.length] = o.eqIndReturn;
            Array.prototype.push.apply(fromO, o.indReturnTR);        
        } 


 //StartDate	EndDate	StProd(w/crnt-terms)	EqAmongIndexesTR	BondTR	NumberMissedCoupons	NumberCouponPaid	MemoryCouponsPaid	LifeInMonths	ReturnIndex	ReturnIndex2	ReturnIndex3	ReturnIndex…ETC	called matured Date
                       
        XLSX.utils.sheet_add_aoa(wsNew, [fromO], {origin: -1}); 
 //       console.log(o);  
        res.push(o);
    }

const statArr = [];
statArr.push(res.map(el => el.returnOfSP), res.map(el => el.bondReturn),
            res.map(el => el.eqIndReturn), res.map(el => el.couponMissed),
            res.map(el => el.couponPaid),res.map(el => el.lifeInMonths));    

    XLSX.utils.sheet_add_aoa(wsNew, [
        ['Minimum','', '','', '', '', '','',''].concat(statArr.map(el => stats.min(el))),
        ['Maximum','', '','', '', '', '','',''].concat(statArr.map(el => stats.max(el))),
        ['Mean','', '','', '', '', '','',''].concat(statArr.map(el => stats.mean(el))),
        ['Mode','', '','', '', '', '','',''].concat(statArr.map(el => stats.mode(el))),
        ['Median','', '','', '', '', '','',''].concat(statArr.map(el => stats.median(el))),
//        ['Harmonic Mean','', '','', '', '', '','',''].concat(statArr.map(el => stats.harmonicMean(el))),
        ['Root Mean Square','', '','', '', '', '','',''].concat(statArr.map(el => stats.rootMeanSquare(el))),
        ['SampleSkewness','', '','', '', '', '','',''].concat(statArr.map(el => stats.sampleSkewness(el))),
        ['Variance','', '','', '', '', '','',''].concat(statArr.map(el => stats.variance(el))),
        ['MedianAbsoluteDeviation','', '','', '', '', '','',''].concat(statArr.map(el => stats.medianAbsoluteDeviation(el))),

            ], {origin: -1});   

    for(let m = 1; m<11; m++) {            
        XLSX.utils.sheet_add_aoa(wsNew, [
            [`${m}0th Percentile`,'', '','', '', '', '','',''].concat(statArr.map(el => stats.quantile(el, m/10)))

                ], {origin: -1});   
                    
        }        

    XLSX.utils.sheet_add_aoa(wsNew, [[stProd.CUSIP, 
                                        stProd['American/European'],
                                        stProd.Issuer,
                                        stProd.IssuerCredit]], {origin: 'A2'});
    
   
        const wbNew = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbNew, wsNew, stProd.CUSIP);
        XLSX.writeFile(wbNew, `${__dirname}\\xlsx\\${stProd.CUSIP}.xlsx`);
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