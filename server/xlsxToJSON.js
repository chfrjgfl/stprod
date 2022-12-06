const fs = require("fs");
const XLSX = require("xlsx");
const { inspect } = require('node:util');

const dbFile = __dirname+ '\\xlsx\\HistRetForStProd.xlsx';

//remakeHistData(__dirname+ '\\xlsx\\HistRetForStProd.xlsx');
const stProd = {inds: ['S&P 500', 'NASDAQ 100', 'Russell 2000']};


console.log(JSON.stringify(stProd));
getHistData(dbFile, stProd.inds);

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
       // bondStart:-1
    }

    let n = arr.findIndex(el => el[0] === 'AGG cumul.');
    Array.prototype.push.apply(res.bondArray, arr[n].slice(2));
    
    // while(res.bondStart < 0 || n < ss.e.r+1) {
    //     if ((arr[n][0]) === 'AGG cumul.') {
    //         res.bondStart = n;
    //         Array.prototype.push.apply(res.bondArray, arr[n].slice(2));
    //     }
    //     n++;
    // }

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

                    ab.push({ind: s, data: aa});
                    ac.push({ind: s, data: ad});

                    j = ss.e.r+1;
                }
            }
        }
        res.indArray.push(ab);
        res.indCumulArray.push(ac);
    }
    let s = 'export const histRet = '+inspect(res,{depth: null, maxArrayLength: null})+';';
    fs.writeFileSync(__dirname+ '\\histRetForStProd.js',s); 
    console.log('Done');    
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
    

