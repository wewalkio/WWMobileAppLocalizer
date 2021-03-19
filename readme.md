# WeWALK Mobile App Localizer

> This script retrieves your app localization from excel file and prepares them to add into application directly.

## Install
Localizer requires [Node.js](https://nodejs.org/) v10+ to run.

1. Install **node & npm**
2. Install requirements with ```npm install``` command.
3. Install **sox** ```brew install sox```
You can install [Brew](https://brew.sh/) for easy installation to **Sox**.

### Editing Excel File

1. **Keys** - Sheet1
Key and values
2. **Speakers** 
Examples -> en_voice_name - Samantha

## Run
Run with ```node index.js```
The script will output localizations file at the same directory.

### Installing speaker voices
Speaker voices requires MacOS

You should follow this
Settings > Accessibility > Speech > System Voice > Customize
Select all speakers that you need after that all speakers start to install automatically

### Generating Sounds For TTS
Make sure all the speaker voices written in excel are installed.
After running ```index.js``` script, 
Run ```./processSounds``` command from terminal. (This comment divides all sounds according to languages.)
**or**
Run ```./processSoundsForAndroid``` command from terminal. (This comment generate all sounds into one folder.)

This script will create a folder then create files inside that folder.

Sounds can be processed according to excel file

### Converting Sounds wav to raw
We ara using sox for convert, you can run this comment in terminal

```sh
sox -c 1 "filename.wav" --encoding signed-integer --endian little "filename.raw" highpass 800 gain 20 norm -1 rate 8k tempo 1.1
```

To trim last 2 seconds of sound

```sh
sox -c 1 "filename.wav" --encoding signed-integer --endian little "filename.raw" highpass 800 gain 20 norm -1 rate 8k tempo 1.1 trim 0 -2
```

[![N|WeWALK](data:image/png;base64,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)](https://wewalk.io)
