/*
Requirements
*/
let XLSX = require('xlsx');
let fs = require('fs');
var https = require('https');

var file = fs.createWriteStream("lokalizasyon.xlsx");
let url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS45lwMo_RMW9pPSPPHBRhjTSjt4hzJkb2i5EE_GMkNbgJEpwCl6AvLftLXi41qvLgtb1KGpyutIdAl/pub?output=xlsx';

// Replace All Method
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

let download = () => new Promise((resolve, reject) => {
    https.get(url, function (res) {
        console.log("Downloading File");
        res.on('data', function (data) {
                file.write(data);
            })
            .on('end', function () {
                file.end();
                resolve('File downloaded');
            })
            .on('error', function () {
                reject('Error');
            })
            .on('close', () => {
                fs.mkdir("ios", (e)=>{if (e && e.code != 'EEXIST') console.log(e)});
                fs.mkdir("android", (e)=>{if (e && e.code != 'EEXIST') console.log(e)});
                generateLocalization();

            });
    });
});

download();

//generateLocalization();

function generateLocalization() {
    /*
    Init
    */
    let table = XLSX.readFile('lokalizasyon.xlsx');

    let sheet = table.Sheets[table.SheetNames[0]]; // First Sheet: Localisations
    let list = XLSX.utils.sheet_to_json(sheet);

    let parameterSheet = table.Sheets[table.SheetNames[1]]; // Second Sheet: Parameters
    let parameters = XLSX.utils.sheet_to_json(parameterSheet)[0];

    let keys = list.shift(); // Retuns language names
    const platforms = ["android", "ios", "voice_menu", "ios_info_plist"];

    let langCodes = Object.keys(keys).splice(4); // Why 4: #, android, ios, voice_menu
    let resource = {
        android: {},
        ios: {},
        voice_menu: {},
        ios_info_plist: {},
    };

    for (var i in langCodes) {
        let langCode = langCodes[i];
        // Adding language arrays to main resource
        resource.android[langCode] = "";
        resource.ios[langCode] = "";
        resource.voice_menu[langCode] = "";
        resource.ios_info_plist[langCode] = "";
    }

    /*
    Iterating XLSX File
    */
    for (var i in list) {
        let row = list[i];
        for (var j in langCodes) {
            let langCode = langCodes[j];
            if (!!row.voice_menu_key) resource.voice_menu[langCode] += processText("voice_menu", langCode, row.voice_menu_key, row[langCode]); //console.log(processText("voice_menu", langCode, row.voice_menu_key, row[langCode]));
            if (!!row.android_key) resource.android[langCode] += processText("android", langCode, row.android_key, row[langCode]);
            if (!!row.ios_key) {
                if (String(row.ios_key).startsWith("NS")) resource.ios_info_plist[langCode] += processText("ios", langCode, row.ios_key, row[langCode]);
                else resource.ios[langCode] += processText("ios", langCode, row.ios_key, row[langCode]);
            }
        }
    }

    /*
    Text Helper Funtion
    */
    function processText(platform, lang, key, value) {
        value = String(value).replaceAll("\n", "\\n");
        switch (platform) {
            case "android":
                if (lang === "ar"){
                    // This dirty hack will be solved as {{O-n}} & {{O}} replacement rather than {{0-n}} {{0}}
                    value = value.replaceAll('\{\{(O-)([0-9])\}\}', '%$2$d');//{{O-n}}
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d');//{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$s');//{{A-n}}
                    value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                    value = value.replaceAll('\{\{(A)\}\}', '%s'); // {{A}}
                } else{
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d');//{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$s');//{{A-n}}
                    value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                    value = value.replaceAll('\{\{(A)\}\}', '%s'); // {{A}}
                }
                value = value.replaceAll("'", String.fromCharCode(92) + "'");
                value = value.replaceAll('"', String.fromCharCode(92) + '"');
                return `<string name="${key}">${value}</string>\n`;
            case "ios":
                if (lang === "ar"){
                    // This dirty hack will be solved as {{O-n}} & {{O}} replacement rather than {{0-n}} {{0}}
                    value = value.replaceAll('\{\{(O-)([0-9])\}\}', 'arabicparam:%$2$d');//{{O-n}}
                    value = value.replaceAll('\{\{(O)([0-9])\}\}', 'arabicparam:%$2$d');//{{O-n}}
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', 'arabicparam:%$2$d%'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', 'arabicparam:%$2$@'); //{{A-n}} 
                } else{
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$@'); //{{A-n}} 
                }
                value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                value = value.replaceAll('\{\{(A)\}\}', '%@'); //{{A}}                    
                value = value.replaceAll('"', String.fromCharCode(92) + '"');
                return `"${key}" = "${value}";\n`;
            case "voice_menu":
                return `say -v ${parameters[lang+"_voice_name"]} "${value}" -o ${lang}_${key}.aiff\n`;
            default:
                return;
        }
    }

    writeFiles();

    /*
    Writing Files
    */

    function writeFiles() {
        for (var i in platforms) {
            let platform = platforms[i];
            let voice_menu_data = "";

            for (var j in langCodes) {
                let lang = langCodes[j];
                let data = resource[platform][lang];
                fs.promises.mkdir(`ios/${lang}.lproj`, { recursive: true }).catch(console.error);
                if (platform === "ios") {
                    fileName = `ios/${lang}.lproj/Localizable.strings`;
                }
                if (platform === "ios_info_plist") {
                    fileName = `ios/${lang}.lproj/Info.plist`;
                    infoPlistFileName = `ios/${lang}.lproj/infoPlist.strings`;
                    fs.writeFile(infoPlistFileName, data, (e) => {
                        if (e) console.log(e);
                    });
                }
                if (platform === "android") {
                    fileName = `android/strings-${lang}.xml`;
                    let start = '<?xml version="1.0" encoding="utf-8" standalone="no"?><resources>\n';
                    let close = '</resources>';
                    data = start + data + close;
                }
                if (platform === "voice_menu") {
                    fileName = "voice_menu.txt";
                    voice_menu_data += data + "\n";
                }
                fs.writeFile(fileName, data, (e) => {
                    if (e) console.log(e);
                });
            }
            fs.writeFile("voice_menu.txt", voice_menu_data, (e) => {
                if (e) console.log(e);
            });
        }
    }
}

//generateLocalization();

/*
NOTES
- New line automatically comes as \n from XLSX
*/