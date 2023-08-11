const puppet = require("puppeteer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { mail, password } = require("./credentials");

const delayInMS = 300;
const bravePath =
  "C:\\Program Files\\BraveSoftware\\Brave-Browser-Beta\\Application\\brave.exe"; //win64

const config = {
  timeout: 0,
  headless: false,
};

if (bravePath) {
  config["executablePath"] = bravePath;
}

//start
(async () => {
  try {
    let browser = await puppet.launch(config);
    let page = await browser.newPage();
    //
    await page.goto("https://www.ratatype.com/login");
    let email = await page.$("#email");
    await email.type(mail);

    let pwd = await page.$("#password");
    await pwd.type(password);

    let login = await page.$('button[type="submit"]');
    await login.click();
    await page.waitForNavigation();

    // Get the userID from the current page URL
    const url = page.url();
    const userID = url.split("/").at(-3);
    const certificateURL = `https://www.ratatype.com/${userID}/certificate/`;

    // profile page

    let btn = await page.waitForSelector(
      'li.nav-item > a[href="/typing-test/"]'
    );
    await btn.click();
    await page.waitForNavigation();

    // test proceeding page
    let start = await page.waitForSelector(
      ".btn.btn-default-outline-blue.jsneed"
    );

    await start.click();
    await page.waitForNavigation();
    //   test ad
    let dialAd = await page.waitForSelector("#startButton");
    await dialAd.click();
    //
    let text = await page.$eval(".mainTxt", (el) => el.textContent);

    // starty typing
    for (const char of text) {
      if (char === char.toUpperCase()) {
        await page.keyboard.down("Shift");
      }

      await page.keyboard.type(char);
      // Add a delay of 300ms
      await new Promise((resolve) => setTimeout(resolve, delayInMS));

      if (char === char.toUpperCase()) {
        await page.keyboard.up("Shift");
      }
    }

    // go to profile
    await page.goto(certificateURL);
    const imageElement = await page.$(".certificateBig > img");

    if (imageElement) {
      const date = new Date().getTime();
      const ssPath = path.join(__dirname, "certificates", `${date}.png`);
      const imageUrl = await imageElement.evaluate((element) =>
        element.getAttribute("src")
      );

      if (imageUrl) {
        const response = await axios.get(
          "https://www.ratatype.com" + imageUrl,
          {
            responseType: "arraybuffer",
          }
        );
        fs.writeFileSync(ssPath, response.data);
        console.log("Certificate downloaded successfully.");
      } else {
        console.log("Image URL not found.");
      }
    } else {
      console.log("Image element not found.");
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  } catch (error) {
    console.log("there was an error", error);
  }
})();
