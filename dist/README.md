# Achievements Collector

Script & template for gathering and displaying Steam (and non-Steam) achievements on your website!

### [Live Example 1]() | [Live Example 2](https://espy.world/showcase/achievements)

## Config

These are the values defined in the `config.js` file.
| Key | Value |
| ------------- | ------------- |
| ICONS_OUTPUT_FOLDER | The path where achievement icons are saved. This can be an absolute or relative path. |
| JSON_OUTPUT_PATH | The path where `achievements.json`, the file that stores all the achievement data, is. This can be an absolute or relative path. |
| RELATIVE_IMAGE_PATH | The path where image file paths stored in `achievements.json` are relative to. This can be an absolute or relative path. |
| FETCH_MODE | Defines the fetch mode for the Steam achievement fetch script. There are two modes: `exclude` and `include`. Exclude is the default behavior, which gets the achievements from all owned games on your Steam account and excludes anything in `EXCLUDE_IDS`. Include only includes games in `INCLUDE_IDS`. |
| EXCLUDE_IDS | If using `exclude` fetch mode, excludes app ids defined here from being fetched. |
| INCLUDE_IDS | If using `include` fetch mode, gets achievements from the app ids listed here. |

To get an app ID of a specific game, go to its Steam store page; the number in the URL is its app ID.

## Getting achievement data from Steam

### Prerequisites

Running the script to gather Steam achievements requires the following:

**Node.js**

- If you don't already have Node.js installed, you can install it here: https://nodejs.org/en/download/current
- If you can type and run `node -v` in the command line and get a version number you should be all set.

**Steam API key**

- You will need a Steam account to get a Steam API key.
- You can get one here: https://steamcommunity.com/dev/apikey
- (You can write anything you want under "Domain Name")

**Steam User ID**

- To get your Steam User ID, while logged into your account, visit this page: https://store.steampowered.com/account/
- Your Steam ID should be displayed near your name on that page.

### Steps

1. Download and unzip the installation.
2. Create a `.env` file in the same area as the `achievements.js` file.
3. Populate the `.env` file with your steam User ID and your Steam API key. You can copy the contents of the `.env.example` file and replace the sample values.
4. Make sure your account game details are set to public (you can set it back to private when you're done). If you're having trouble, see this [image](/images/game_details.png) for what settings need to be public.
5. Run `node achievements.js` in your command line. This will create an `achievements.json` file and populate the `icons` folder with the relevant achievement icons.
6. Done!

> [!WARNING]
> Never share your API key with anyone! Take care to never upload the `.env` file to your site, as it contains sensitive data.

## Adding achievements manually

If you can't be bothered with the Steam stuff (or just want to add non-Steam achievements), you can do that too! Here's how.

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

What each key means:
| Key | Value |
| ------------- | ------------- |
| game | the associated game id you defined earlier (not the same as the title) |
| timestamp | UNIX timestamp of when the achievement was unlocked. You can generate one [here](https://www.unixtimestamp.com/). |
| title | achievement title |
| desc | achievement description |
| img | path/url to image/icon associated with achievement |
| src | the source of what added this achievement to the file. since you're doing this manually, you should write `manual` here | 3. You're done!

## Connecting achievement data to an HTML page

You can connect the data to your site however you want.

### Getting started

In the installation, there is an example folder, complete with a template HTML file, `achievements.json`, and an icons folder.

1. You should move the `template.html` file where you want your page to be on your site, as well as the icons folder and `achievements.json`.
2. Set the paths to your icon folder and `achievements.json` file in `config.js`. You should also set the `RELATIVE_IMAGE_PATH`. It is reccomended to set this to your root site folder.
3. Depending on your site configuration, you may need to edit the `jsonPath` variable in `template.html` to point to where `achievements.json` is stored on your site.
4. Populate your achievement data to `achievements.json` if you haven't already (either manually or with `achievements.js`).
5. You should see your achievements show up in `template.html` (or whatever you renamed it to)!
6. And you're done! Feel free to customize it to your liking.

A footer is provided in the template. Feel free to remove the credit in the footer if you wish.
If images aren't loading due to incorrect image paths in `achievements.json`, try setting `RELATIVE_IMAGE_PATH` in `config.js`.
