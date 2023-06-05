const sql = require("mssql");
const csv = require("csv-parser");
const stripBom = require('strip-bom-stream');
const fs = require('fs');
const sqlConfig = require("../sqlConfig.json");
const getDate = require("../getDate.js");
const axios = require('axios');


const dir = "./CSVs";


const dirents = fs.readdirSync(dir, { withFileTypes: true });
const files = dirents
    .filter(dirent => dirent.isFile() && dirent.name.substring(dirent.name.length-4)==".csv")
    .map(dirent => dirent.name);
let fileIds = [];

if (files.length > 0) {
	insertFile(0);
}
else {
	console.error("No files to process");
}

let monthDates = [];
let error = false;

const currencies = {};                  //--------------------------------------


function getRecords(i) {



	const divHistArr = [];
	console.log("Processing " + files[i]);
	const fileStream = fs.createReadStream(dir + "/" + files[i])
	  .pipe(stripBom())
	  .pipe(csv({ columns: true, rowDelimiter: "\r\n", bom: true, skip_lines_with_error: true }))
	  .on('headers', (headers) => {
		monthDates = headers.reduce((acc, h) => {
		  if (h.includes("Equity Style Box (Long) \n"))
			acc.push({
				mdate: getDate.parse(h.substring(h.length-7,h.length)+"-01"),
				mstring: h.substring(h.length-7,h.length)
			})
		  return acc;
	    }, []);
	  })
	  .on('data',  (row) => {
		if (row.Name && row.SecId!=="Count" && !error) {
			
		if (row["Dividend Amount History"].length > 0) {
			const hArr = row["Dividend Amount History"]
						.split(';')
						.filter(el => el.length>0)
						.map(el => el.replace(/\[/g, '').split(']'))
						.map(async (el) => {if(el.length ===2) return el; 
									return [el[0], await convertCurrency(el[el.length-1], el[el.length-2])]})
						.filter (el => el[1]);
						//.map(el => {return{date: el[0], amount: parseFloat(el[1])}});
									

			if (hArr.length > 0) divHistArr.push( 
			{SecID: row["SecId"], 
			frequency: row["Dividend Distribution \nFrequency"],
			historyArr: hArr});
			}
			
		}
	  })
	  .on('error', (err) => {
		console.error(err || "How do I get this error?");
		error = true;
	  })
	  .on('end', () => {
		if (error) {
			console.error("Ending file processing due to errors");
		}
		else {

			fs.rename(dir + "/" + files[i], dir + "/Processed/" + files[i], err => {
				if (err) {
					console.error(err);
				}
				else {   if (files.length > i+1) insertFile(i+1);    //------------------------

				}
			});
		}
	  });
}

function insertFile(i) {
	sql.connect(sqlConfig).then(() => {
		const request = new sql.Request();
		request.query("INSERT INTO dbo.Files(FileName, ProcessDate) VALUES('" + files[i] + "', GETUTCDATE()) SELECT SCOPE_IDENTITY() as id").then(resp => {
			fileIds[i] = resp.recordset[0].id;
			sql.close();

//			fileIds[i] = i;  //delete this

	 		getRecords(i);

		});
	}).catch(err => {
		console.error(err);
		sql.close();
	});
}



async function convertCurrency (amt, cur) {
	if (cur === 'USD') return amt;

        if (!Object.hasOwn(currencies, cur)) Object.defineProperty(currencies, cur, {
            value: [],
            writable: true
        });
        if (currencies[cur].length === 0)  {
            getExchangeRates(cur);
        }
							//------------------------
}

async function getExchangeRates(c) {
    console.log("Getting " + c);   
    try {
        const res = await axios.get("https://www.alphavantage.co/query?function=FX_DAILY&outputsize=full&from_symbol=" + c + "&to_symbol=USD&apikey=QFB69C1MWZ68C6R");
        if (!res.data["Error Message"]) {
            const ar = [];
            for (const [priceDateString, price] of Object.entries(res.data["Time Series FX (Daily)"])) {
               
				ar.push(
                        priceDateString,							
                        price["1. open"]
                    );
                
            }
            currencies[c] =  ar;
            console.log (`Got ${currencies[c].length} elements`);
        }
        else {
            console.error(c + " Not Found");
        }
    } catch (error) {
        console.error(error);
    }
}

