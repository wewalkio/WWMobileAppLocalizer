# Localizer

This script retrieves WeWALK app localization from GSheet and prepares them to add into application directly.

## Install

1. Install **node & npm**
2. Install requirements with ```npm install``` command.

## Run

Run with ```node index.js```

The script will output localizations file at the same directory.

### Generating Sounds

After running ```index.js``` script, run ```./processSounds``` command from terminal.

This script will create a folder then create files inside that folder.

Sounds can be processed according to this document: [WeWALK Sound Specs](https://docs.google.com/document/d/1bxShxEvYtJwUjouTUyE6q_HQcOx_UFY4-5LeAuoxIIM/edit?usp=sharing)

## Known Issues

- Sometimes generated voice_menu.txt file has lines without ```say -v``` prefix. Which cause the break of processSounds script.