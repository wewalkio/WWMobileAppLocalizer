/*
Requirements
*/
let XLSX = require('xlsx');
let fs = require('fs');
// var https = require('https');
const {
    http,
    https
} = require('follow-redirects');

// Replace All Method
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

generateLocalization();

async function generateLocalization() {
    /*
    Init
    */
    let table = XLSX.readFile('Localization.xlsx');

    let sheet = table.Sheets[table.SheetNames[0]]; // First Sheet: Localisations
    let list = XLSX.utils.sheet_to_json(sheet);

    let parameterSheet = table.Sheets[table.SheetNames[1]]; // Second Sheet: Parameters
    let parameters = XLSX.utils.sheet_to_json(parameterSheet)[0];

    let keys = list.shift(); // Retuns language names
    const platforms = ["android", "ios", "voice_menu", "ios_info_plist", "service"];

    let langCodes = Object.keys(keys).splice(4); // Why 4: #, android, ios, voice_menu
    let resource = {
        android: {},
        ios: {},
        ios_info_plist: {},
        voice_menu: {},
        service: {},
    };

    await createDirectories();

    for (var i in langCodes) {
        let langCode = langCodes[i];
        // Adding language arrays to main resource
        resource.android[langCode] = "";
        resource.ios[langCode] = "";
        resource.voice_menu[langCode] = "";
        resource.ios_info_plist[langCode] = "";
        resource.service[langCode] = "";
    }

    /*
    Iterating XLSX File
    */
    let lastElem = false
    for (var i in list) {
        if (i == list.length - 1) {
            lastElem = true
            console.log("lastelem" + i + " --- " + list.length)
        }
        // console.log("lastelem" + i + " --- " + list.length)

        let row = list[i];
        for (var j in langCodes) {
            let langCode = langCodes[j];
            if (!!row.voice_menu_key) resource.voice_menu[langCode] += processText("voice_menu", langCode, row.voice_menu_key, row[langCode], undefined);
            if (!!row.android_key) resource.android[langCode] += processText("android", langCode, row.android_key, "", row[langCode], undefined);
            if (!!row.ios_key) {
                if (String(row.ios_key).startsWith("NS")) {
                    resource.ios_info_plist[langCode] += processText("ios", langCode, "", row.ios_key, row[langCode], undefined);
                }
                else {
                    resource.ios[langCode] += processText("ios", langCode, "", row.ios_key, row[langCode], undefined);
                    resource.service[langCode] += processText("service", langCode, row.android_key, row.ios_key, row[langCode], lastElem);
                }
            }
        }
    }

    /*{{А-2}}
    Text Helper Funtion
    */
    function processText(platform, lang, and_key, key, value, lastElem) {
        value = String(value).replaceAll("\n", "\\n");
        switch (platform) {
            case "android":
                if (lang === "ar") {
                    // This dirty hack will be solved as {{O-n}} & {{O}} replacement rather than {{0-n}} {{0}}
                    value = value.replaceAll('\{\{(O-)([0-9])\}\}', '%$2$d'); //{{O-n}}
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$s'); //{{A-n}}
                    value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                    value = value.replaceAll('\{\{(A)\}\}', '%s'); // {{A}}
                } else {
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$s'); //{{A-n}}
                    value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                    value = value.replaceAll('\{\{(A)\}\}', '%s'); // {{A}}
                }
                value = value.replaceAll("'", String.fromCharCode(92) + "'");
                value = value.replaceAll('"', String.fromCharCode(92) + '"');
                return `<string name="${and_key}">${value}</string>\n`;
            case "ios":
                if (lang === "ar") {
                    // This dirty hack will be solved as {{O-n}} & {{O}} replacement rather than {{0-n}} {{0}}
                    value = value.replaceAll('\{\{(O-)([0-9])\}\}', 'arabicparam:%$2$d'); //{{O-n}}
                    value = value.replaceAll('\{\{(O)([0-9])\}\}', 'arabicparam:%$2$d'); //{{O-n}}
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', 'arabicparam:%$2$d%'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', 'arabicparam:%$2$@'); //{{A-n}} 
                } else {
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$@'); //{{A-n}} 
                }
                value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                value = value.replaceAll('\{\{(O)\}\}', '%d'); //{{0}}
                value = value.replaceAll('\{\{(A)\}\}', '%@'); //{{A}}                    
                value = value.replaceAll('"', String.fromCharCode(92) + '"');
                return `"${key}" = "${value}";\n`;
            case "service":
                if (lang === "ar") {
                    // This dirty hack will be solved as {{O-n}} & {{O}} replacement rather than {{0-n}} {{0}}
                    value = value.replaceAll('\{\{(O-)([0-9])\}\}', 'arabicparam:%$2$d'); //{{O-n}}
                    value = value.replaceAll('\{\{(O)([0-9])\}\}', 'arabicparam:%$2$d'); //{{O-n}}
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', 'arabicparam:%$2$d%'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', 'arabicparam:%$2$#s'); //{{A-n}} 
                } else {
                    value = value.replaceAll('\{\{(0-)([0-9])\}\}', '%$2$d'); //{{0-n}}
                    value = value.replaceAll('\{\{(A-)([0-9])\}\}', '%$2$#s'); //{{A-n}} 
                    value = value.replaceAll('\{\{(А-)([0-9])\}\}', '%$2$#s'); //{{A-n}} 
                }
                value = value.replaceAll('\{\{(0)\}\}', '%d'); //{{0}}
                value = value.replaceAll('\{\{(O)\}\}', '%d'); //{{0}}
                value = value.replaceAll('\{\{(A)\}\}', '%#s'); //{{A}}                    
                value = value.replaceAll('\{\{(А)\}\}', '%#s'); //{{A}}                    
                value = value.replaceAll('"', String.fromCharCode(92) + '"');
                if (!lastElem)
                    return `{\n     "and_key": "${key}",\n     "key": "${key}",\n     "value": "${value}",\n     "languageKey": "${lang}"\n},\n`;
                else
                    return `{\n     "and_key": "${key}",\n     "key": "${key}",\n     "value": "${value}",\n     "languageKey": "${lang}"\n}\n`;

            case "voice_menu":
                return `say -v ${parameters[lang + "_voice_name"]} "${value}" -o ${lang}_${key}.aiff\n`;
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
            let service_data = "";


            if (platform === "service") {
                service_data += `{\n"languages": [\n`
            }
            var lastElem = false
            for (var j in langCodes) {
                if (lastElem === langCodes - 1) {
                    lastElem = true
                }
                let lang = langCodes[j];
                let data = resource[platform][lang];
                if (platform === "ios") {
                    fileName = `outputs/ios/${lang}.lproj/Localizable.strings`;
                }
                if (platform === "ios_info_plist") {
                    fileName = `outputs/ios/${lang}.lproj/Info.plist`;
                    infoPlistFileName = `outputs/ios/${lang}.lproj/InfoPlist.strings`;
                    fileName2 = `outputs/ios-plist/${lang}.lproj/Info.plist`;
                    infoPlistFileName2 = `outputs/ios-plist/${lang}.lproj/InfoPlist.strings`;
                    fs.writeFile(infoPlistFileName, data, (e) => {
                        if (e) console.log(e);
                    });
                    fs.writeFile(fileName2, data, (e) => {
                        if (e) console.log(e);
                    });
                    fs.writeFile(infoPlistFileName2, data, (e) => {
                        if (e) console.log(e);
                    });
                }
                if (platform === "service") {
                    fileName = `outputs/service/languages.json`;
                    let start = `{\n"language": "${lang}",\n"keys": [\n`;
                    let close = `\n]}${!lastElem ? "," : ""}\n`;
                    service_data += start + data + close;
                }
                if (platform === "android") {
                    if (lang === "en") {
                        fs.promises.mkdir(`outputs/android/values`, {
                            recursive: true
                        }).catch(console.error);
                        fileName = `outputs/android/values/strings.xml`;
                    } else {
                        let alang = lang
                        if (lang === "pt-BR") {
                            alang = "pt-rBR"
                        }
                        else if (lang === "ro") {
                            alang = "ro-rRO"
                        }
                        fileName = `outputs/android/values-${alang}/strings.xml`;
                    }
                    let start = '<?xml version="1.0" encoding="utf-8" standalone="no"?><resources>\n';
                    let close = '</resources>';
                    data = start + data + close;
                }
                if (platform === "voice_menu") {
                    fileName = "outputs/voice_menu.txt";
                    voice_menu_data += data + "\n";
                }

                if (!(platform === "voice_menu" || platform === "service")) {
                    fs.writeFile(fileName, data, (e) => {
                        if (e) console.log(e);
                    });
                }

            }

            if (platform === "service") {
                service_data += `]}`
                let n = service_data.lastIndexOf("]},")
                service_data = service_data.substring(0, n)
                service_data = service_data + "]}]}"
                console.log(service_data)
            }

            fs.writeFile("outputs/voice_menu.txt", voice_menu_data, (e) => {
                if (e) console.log(e);
            });
            fs.writeFile("outputs/service/languages.json", service_data, (e) => {
                if (e) console.log(e);
            });
        }
    }

    async function createDirectories() {
        for (var j in langCodes) {
            let lang = langCodes[j];
            await fs.promises.mkdir(`outputs`, {
                recursive: true
            }).catch(console.error);
            if (lang === "en") {
                await fs.promises.mkdir(`outputs/android/values`, {
                    recursive: true
                }).catch(console.error);
            } else {
                let alang = lang
                if (lang === "pt-BR") {
                    alang = "pt-rBR"
                }
                else if (lang === "ro") {
                    alang = "ro-rRO"
                }
                await fs.promises.mkdir(`outputs/android/values-${alang}`, {
                    recursive: true
                }).catch(console.error);
            }
            await fs.promises.mkdir(`outputs/ios/${lang}.lproj`, {
                recursive: true
            }).catch(console.error);
            await fs.promises.mkdir(`outputs/ios-plist/${lang}.lproj`, {
                recursive: true
            }).catch(console.error);
            await fs.promises.mkdir(`outputs/service`, {
                recursive: true
            }).catch(console.error);
        }
    }
}

/*
NOTES
- New line automatically comes as \n from XLSX
*/