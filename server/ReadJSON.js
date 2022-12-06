const fs = require("fs");


const dbFile = __dirname+ '\\xlsx\\HistRetForStProd.json';

//remakeHistData(__dirname+ '\\xlsx\\HistRetForStProd.xlsx');
//const stProd = {inds: ['S&P 500', 'NASDAQ 100', 'Russell 2000']};
const dbData = JSON.parse(fs.readFileSync(dbFile, (err, data) => (data)));

console.log(JSON.stringify(stProd));
