/*
Requirements
*/
let XLSX = require('xlsx');
let fs = require('fs');

// Replace All Method
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


/*
Init
*/
let table = XLSX.readFile('lokalizasyon.xlsx');

let sheet = table.Sheets[table.SheetNames[0]]; // First Sheet: Localisations
let list = XLSX.utils.sheet_to_json(sheet);

let parameterSheet = table.Sheets[table.SheetNames[1]]; // Second Sheet: Parameters
let parameters = XLSX.utils.sheet_to_json(parameterSheet)[0];

let keys = list.shift(); // Retuns language names
const platforms = ["android", "ios", "voice_menu"];

let langCodes = Object.keys(keys).splice(4); // Why 4: #, android, ios, voice_menu
let resource = { android: {}, ios: {}, voice_menu: {}};

for (var i in langCodes) {
    let langCode = langCodes[i];
    // Adding language arrays to main resource
    resource.android[langCode] = "";
    resource.ios[langCode] = "";
    resource.voice_menu[langCode] = "";
}


/*
Iterating XLSX File
*/
for (var i in list) {
    let row = list[i];
    for (var j in langCodes) {

        let langCode = langCodes[j];
        if (!!row.voice_menu_key) resource.voice_menu[langCode] += processText("voice_menu", langCode, row.voice_menu_key, row[langCode]);
        if (!!row.android_key) resource.android[langCode] += processText("android", langCode, row.android_key, row[langCode]);
        if (!!row.ios_key) resource.ios[langCode] += processText("ios", langCode, row.ios_key, row[langCode]);
    }
}


/*
Text Helper Funtion
*/
function processText(platform, lang, key, value) {
    switch (platform) {
        case "android":
                value = String(value).replaceAll('"', String.fromCharCode(92) + '"');
                value = value.replaceAll('{{0}}', '%d');
                value = value.replaceAll('{{A}}', '%s');
            return `<string name="${key}">${value}</string>\n`;
        case "ios":
            value = String(value).replaceAll('"', String.fromCharCode(92) + '"');
            value = value.replaceAll('{{0}}', '%d');
            value = value.replaceAll('{{A}}', '%@');
            return `"${key}" = "${value}"\n`;
        case "voice_menu":
            return `say -v ${parameters[lang+"_voice_name"]} ${value} -o ${lang}_${key}.aiff\n`;
        default:
            return;
    }
}


/*
Writing Files
*/
writeToFile();
function writeToFile() {
    for (var i in platforms) {
        let platform = platforms[i];
        let voice_menu_data = "";

        for (var j in langCodes) {
            let lang = langCodes[j];
            let data = resource[platform][lang];
            
            if (platform === "ios") {
                fileName = keys[lang] + ".strings";
            }
            if (platform === "android") {
                fileName = `strings-${lang}.xml`;
                let start = '<?xml version="1.0" encoding="utf-8" standalone="no"?><resources>';
                let close = '</resources>'
                data = data + closeXml;
            }
            if (platform === "voice_menu") {
                voice_menu_data += data;
            }
            fs.writeFile(fileName, data, (err) => {
                if (err) throw err;
            });
        }
        fs.writeFile("voice_menu.txt", voice_menu_data, (err) => {
            if (err) throw err;
        });
    }
}

/*

TODOS
- download file

NOTES
- New line automatically comes as \n from XLSX
*/


