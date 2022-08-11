# Computress
Computress is a Node-based discord bot for OpenFusion.<br />
Computress operates by listening to the monitor port on your OF server.

## THIS IS A FORK
All credits go the origional uploader https://github.com/OpenFusionProject/Computress<br />
My goal for this update was just to upgrade Discord.js version, but also include a couple of QOL updates, the config.json file for example

## Usage
Ensure you have node and npm installed.
```
npm install
node main.js [ip[:port]]
```

## Features
Computress currently offers the following functionality:
- Show server population in activity message
- Check server monitor status (`$status` / `$up`)
- Dump in-game chat and email to a specific text channel

Planned features that are currently WIP:
- Dump name requests to a specific text channel
- Approve or reject name requests through reactions
