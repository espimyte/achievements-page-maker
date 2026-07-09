# Achievements Collector

Template for gathering and displaying achievements on your website!
Comes with a script to import Steam achievements.

### [Download](https://github.com/espimyte/achievements-page-maker/releases/latest/download/achievements-page-maker.zip)

### [Live Example 1](https://espimyte.github.io/achievements-page-maker/example/achievements.html) | [Live Example 2](https://espy.world/showcase/achievements)

## How to Use

### The Template

When you download and unzip the file, there will be two folders: "template" and "scripts".

The template folder has the html page already set up for you, with some example achievements! Feel free to play around with it. You're free to customize this template however you like.

To use this template on your site, move everything inside the template folder anywhere on your site.

### Adding achievements (manually)

1. Define a game under in the `achievements.json` file for your achievement. If the game is already defined, you can skip this step. Example below.

```json
"games": {
  "caves_of_qud": { "title": "Caves of Qud" }
}
```

2. Add your achievement data. Example below.

```json
"achievements": [
  {
    "game": "caves_of_qud",
    "timestamp": 1740649650,
    "title": "On the Rocks",
    "desc": "Drink lava.",
    "img": "icons/caves_of_qud/88b4f861333025cf989e2e4bd181c3e60b2678d4.jpg",
    "src": "manual"
  },
]
```

| Key       | Value                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| game      | the associated game id you defined earlier                                                                              |
| timestamp | UNIX timestamp of when the achievement was unlocked. You can generate one [here](https://www.unixtimestamp.com/).       |
| title     | achievement title                                                                                                       |
| desc      | achievement description                                                                                                 |
| img       | path/url to image/icon associated with achievement                                                                      |
| src       | the source of what added this achievement to the file. since you're doing this manually, you should write `manual` here |

3. Your achievements should show up in the template. Hooray!

## Importing achievement data from Steam

In the download, there is a 'scripts' folder, which will have an `steam-achievements.js` script.

To learn how to use this script, see [here](/src/import_from_steam.md).
