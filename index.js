//const Discord = require('discord.js'); //import discord.js
require('dotenv').config();
const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');
const cron = require('node-cron');

const fs = require('fs');

//const client = new Discord.Client(); //create new client
const { Client, GatewayIntentBits, Partials } = require('discord.js')

const client = new Client({
    'intents': [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildMessages
    ],
    'partials': [Partials.Channel]
  });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

cron.schedule('*/1 * * * *', () => {
    callScrap();
});

client.on('messageCreate', msg => {
    if (msg.content === 'ping') {
        msg.reply('Good news incoming from the sunny shores? :laxtodoubt: to doubt https://www.pokebeach.com/');
    }    
});

const callScrap = async () => {
    const config = {
        baseSiteUrl: `https://www.pokebeach.com/`,
        startUrl: `https://www.pokebeach.com/`,
        filePath: './',
        concurrency: 10,//Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
        maxRetries: 3,//The scraper will try to repeat a failed request few times(excluding 404). Default is 5.       
    }
    

    const scraper = new Scraper(config);//Create a new Scraper instance, and pass config to it.

    //Now we create the "operations" we need:

    const root = new Root();//The root object fetches the startUrl, and starts the process.  
 
    //Any valid cheerio selector can be passed. For further reference: https://cheerio.js.org/
    const category = new OpenLinks('.category',{name:'category'});//Opens each category page.

    const article = new CollectContent('article .entry-title a', {
        name:'href',
        getElementContent: (a, b, c) => {
            const href = c.attr('href')
            return `${href}` // would like to return { html, href }
        },
    });//Opens each article page.

    root.addOperation(article);//Then we create a scraping "tree":
      //category.addOperation(article);

    await scraper.scrape(root);
    const articles = article.getData()

    let rawdata = fs.readFileSync('news.json');
    let news = JSON.parse(rawdata);

    for (let article of articles) {
        if (!news.includes(article)) {
            client.channels.fetch('1054427398302601216').then(channel=>channel.send(`Good news incoming from the sunny shores: ${article}`));
            news.push(article);
        }
    }    

    fs.writeFile('news.json', JSON.stringify(news), (err) => {
        if (err)
          console.log(err);
        else {
          console.log("File written successfully\n");
          console.log("The written has the following contents:");
          let fileContent = fs.readFileSync('news.json')
          console.log(JSON.parse(fileContent));
        }
    });

}

//make sure this line is the last line
client.login('CODE'); //login bot using token
