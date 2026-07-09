# Achievements Collector

Script & template for gathering and displaying Steam (and non-Steam) achievements on your website!

### [Download]()

### [Live Example 1]() | [Live Example 2](https://espy.world/showcase/achievements)

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

## Getting achievement data from Steam

In the download, there is a 'scripts' folder, which will have an `import-steam.js` script.

In order to use this script, you will need the following prerequisites:

**Node.js**

- If you don't already have Node.js installed, you can install it here: https://nodejs.org/en/download/current
- If you can type and run `node -v` in the command line and get a version number you should be all set.

**A Steam account**

**Steam User ID**

- To get your Steam User ID, while logged into your account, visit this page: https://store.steampowered.com/account/
- Your Steam ID should be displayed near your name on that page.

**Steam API key**

- You can get one here: https://steamcommunity.com/dev/apikey
- You can write anything you want under "Domain Name"

### Steps

1. Before you begin, you should take a look at the `config.js` file. Make sure that the `JSON_OUTPUT_PATH` variable points to your `achievements.json` file (or where you intend it to be).

Here's a table of every config variable:
| Variable | Description |
| ------------- | ------------- |
| JSON_OUTPUT_PATH | The path where `achievements.json`, the file that stores all the achievement data, is. This can be an absolute or relative path. |
| USE_DIRECT_LINKS | Whether or not to use direct image links or download images. If you want to directly download the achievement icons to your computer, set this to false. |
| ICONS_OUTPUT_FOLDER | The folder path where achievement icons are saved (if `USE_DIRECT_LINK` is set to false). This can be an absolute or relative path. |
| RELATIVE_IMAGE_PATH | The path where image file paths stored in `achievements.json` are relative to. This can be an absolute or relative path. |
| FETCH_MODE | Defines the fetch mode for the Steam achievement fetch script. There are two modes: `exclude` and `include`. Exclude is the default behavior, which gets the achievements from all owned games on your Steam account and excludes anything in `EXCLUDE_IDS`. Include only includes games in `INCLUDE_IDS`. |
| EXCLUDE_IDS | If using `exclude` fetch mode, excludes app ids defined here from being fetched. |
| INCLUDE_IDS | If using `include` fetch mode, gets achievements from the app ids listed here. |

2. Create a `.env` file in the same area as the script.
3. Populate the `.env` file with your steam User ID and your Steam API key. You can copy the contents of the `.env.example` file and replace the sample values.

> [!WARNING]
> Take care to never share/publish the contents of this file anywhere, as your API key is sensitive data.

4. Make sure your account game details are set to public (you can set it back to private when you're done). If you're having trouble, see this [image](/images/game_details.png) for what settings need to be public.
5. Run `node scripts/import-steam.js` in your command line. This will create an `achievements.json` file (or modify it if it already exists) at the location specified in `config.js`.

If you turned `USE_DIRECT_LINKS` in the config to false, it will also download the relevant achievement icons to the specified icons folder.

6. And you're done! You can run the script again at any time to update it with your most recent Steam achievements. It will not override any achievements you've added manually.
