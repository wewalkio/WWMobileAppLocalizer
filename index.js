const XLSX = require('xlsx');
const fs = require('fs');

const table = XLSX.readFile('WeWALK App Lokalizasyon.xlsx');
const sheet = table.Sheets[table.SheetNames[0]];
const range = XLSX.utils.decode_range(sheet['!ref']);

const isiOS = true;

const iOSFileNames = [
  'Turkish',
  'English',
  'Portuguese',
  'Arabic'
];

const androidFileNames = [
  'values',
  'values-tr',
  'values-pt',
  'values-ar'
];



runScript();

function runScript() {
  let keyColumnNumber = 0;
  if (isiOS) {
    keyColumnNumber = 1;
  }

  for (let colNum = 2; colNum <= range.e.c; colNum++) {
    let data = "";
    for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
      const keyCell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: keyColumnNumber })];
      const cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: colNum })];
      if (keyCell === undefined || cell === undefined) {  // for empty cells
        continue;
      }
      console.log(cell.v);
      if (isiOS) {
        data += `"${keyCell.v}" = "${cell.v}";\n`
      } else {

      }
    }
    if (isiOS) {
      writeToFileForiOS(iOSFileNames[colNum - 2], data);
    } else {
      writeToFileForAndroid(androidFileNames[0], data);
    }
  }
}

function writeToFileForiOS(fileName, data) {
  fs.writeFile(`${fileName}.strings`, data, (err) => {
    if (err) throw err;
  });
}

function writeToFileForAndroid(fileName, data) {
  fs.writeFile(`${fileName}.xml`, data, (err) => {
    if (err) throw err;
  });
}