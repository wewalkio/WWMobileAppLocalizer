
let fs = require('fs');
const axios = require('axios').default;
generateLocalizationV2();

async function generateLocalizationV2() {
    // let langCodes = await getLangCodes()
    // console.log(JSON.stringify(langCodes))
    let languages = await getTexts()
    let langArray = languages.map(x => x.language)
    createDirectoriesv2(langArray)
    let voiceStr = ""
    for (let index = 0; index < languages.length; index++) {
        let language = languages[index].language
        const texts = languages[index].keys;
        let iosStr = ""
        let andStr = ""
        let plistStr = ""
        let speakerStr = ""

        for (let kindex = 0; kindex < texts.length; kindex++) {
            if (texts[kindex].speakerKey) {
                const value = texts[kindex].value
                speakerStr = value
            }
        }

        for (let kindex = 0; kindex < texts.length; kindex++) {
            const value = texts[kindex].value
            if (texts[kindex].key) {
                const key = texts[kindex].key;
                iosStr += processTextV2ForIos(key, value, language)
            }

            if (texts[kindex].andKey) {
                const key = texts[kindex].andKey;
                andStr += processTextV2ForAndroid(key, value, language)
            }

            if (texts[kindex].voiceKey) {
                const key = texts[kindex].voiceKey;

                voiceStr += processTextV2ForVoice(key, value, language, speakerStr)
            }

            if (texts[kindex].plistKey) {
                const key = texts[kindex].plistKey
                plistStr += processTextV2ForIos(key, value, language)
            }

        }
        writeFilesV2(language, iosStr, andStr, plistStr)
    }
    writeFilesV2ForVoice(voiceStr)
}

function processTextV2ForIos(key, value, language) {
    value = String(value).replaceAll("\n", "\\n");

    if (language === "ar") {
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
}

function processTextV2ForAndroid(andKey, value, language) {
    value = String(value).replaceAll("\n", "\\n");
    if (language === "ar") {
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
    return `<string name="${andKey}">${value}</string>\n`;
}

function processTextV2ForVoice(voiceKey, value, language, speakerName) {
    return `say -v ${speakerName} "${value}" -o ${language}_${voiceKey}.aiff\n`;
}

async function getTexts() {
    let config = {
        headers: {
            client: 0,
        }
    }
    const response = await axios.post("http://localhost:3000/api/v2/localization/exportAllKeys", {}, config)
    return response.data.data.languages
}

async function createDirectoriesv2(langCodes) {
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

function writeFilesV2(langCode, iosData, androidData, plistData) {
    if (iosData) {
        let fileName = `outputs/ios/${langCode}.lproj/Localizable.strings`;

        fs.writeFile(fileName, iosData, (e) => {
            if (e) console.log(e);
        });
    }

    if (androidData) {

        if (langCode === "en") {
            // fs.promises.mkdir(`outputs/android/values`, {
            //     recursive: true
            // }).catch(console.error);
            fileName = `outputs/android/values/strings.xml`;
        } else {
            let alang = langCode
            if (langCode === "pt-BR") {
                alang = "pt-rBR"
            }
            else if (langCode === "ro") {
                alang = "ro-rRO"
            }
            fileName = `outputs/android/values-${alang}/strings.xml`;
        }
        let start = '<?xml version="1.0" encoding="utf-8" standalone="no"?><resources>\n';
        let close = '</resources>';
        androidData = start + androidData + close;
        fs.writeFile(fileName, androidData, (e) => {
            if (e) console.log(e);
        });
    }

    if (plistData) {
        let fileName = `outputs/ios/${langCode}.lproj/Info.plist`;
        let infoPlistFileName = `outputs/ios/${langCode}.lproj/InfoPlist.strings`;
        let fileName2 = `outputs/ios-plist/${langCode}.lproj/Info.plist`;
        let infoPlistFileName2 = `outputs/ios-plist/${langCode}.lproj/InfoPlist.strings`;
        fs.writeFile(fileName, plistData, (e) => {
            if (e) console.log(e);
        });
        fs.writeFile(infoPlistFileName, plistData, (e) => {
            if (e) console.log(e);
        });
        fs.writeFile(fileName2, plistData, (e) => {
            if (e) console.log(e);
        });
        fs.writeFile(infoPlistFileName2, plistData, (e) => {
            if (e) console.log(e);
        });
    }
}

function writeFilesV2ForVoice(voiceData) {
    if (voiceData) {
        let fileName = "outputs/voice_menu.txt";
        voiceData += "\n";
        fs.writeFile(fileName, voiceData, (e) => {
            if (e) console.log(e);
        });
    }
}


// Replace All Method
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
