# WeWALK Mobile App Localizer

This script retrieves your app localization from excel file and prepares them to add into application directly.

## Install

1. Install **node & npm**
2. Install requirements with ```npm install``` command.

## Run

Run with ```node index.js```

The script will output localizations file at the same directory.

### Generating Sounds

After running ```index.js``` script, run ```./processSounds``` command from terminal.

This script will create a folder then create files inside that folder.

Sounds can be processed according to excel file

## Known Issues

- Sometimes generated voice_menu.txt file has lines without ```say -v``` prefix. Which cause the break of processSounds script.