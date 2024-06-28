const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {

    const domain = "https://dev-api.kmapshot.com";

    let type = event.queryStringParameters.type;
    let companyType = event.queryStringParameters.companyType;
    let lng = event.queryStringParameters.lng;
    let lat = event.queryStringParameters.lat;
    let level = event.queryStringParameters.level;
    let layerMode = event.queryStringParameters.layerMode;
    let noLabel = event.queryStringParameters.noLabel;

    let goal_width;

    if (companyType === 'kakao') {
      switch (level) {
        case '1':
          goal_width = 5000;
          break;
        case '2':
          goal_width = 4000;
          break;
        case '5':
          goal_width = 5000;
          break;
        case '10':
          goal_width = 5000;
          break;
        default:
          goal_width = 0;
          break;
      }
    } else { // 구글
      switch (level) {
        case '1':
          goal_width = 5500;
          break;
        case '2':
          goal_width = 4500;
          break;
        case '5':
          goal_width = 5500;
          break;
        case '10':
          goal_width = 5500;
          break;
        default:
          goal_width = 0;
          break;
      }
    }

    const httpResponseMetadata = {
      statusCode: 200,
      headers: {
        "Content-Type": "image/jpeg"
      }
    };

    await chromium.font('/opt/NotoSansKR-Regular.otf');

    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,

      defaultViewport: {
        width: goal_width,
        height: goal_width
      },

      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(domain + `/image/template/` + companyType + `?`
      + `layerMode=` + layerMode
      + `&lat=` + lat
      + `&level=` + level
      + `&lng=` + lng
      + `&type=` + type
      + `&companyType=` + companyType
      + `&noLabel=` + noLabel);

    await page.waitForSelector('#checker_true');

    responseStream = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);
    
    let imageBuffer = await page.screenshot({
      type: "jpeg"
    });
    
    responseStream.write(imageBuffer);
    responseStream.end();

    let browserPid = browser.process()?.pid

    if (browserPid) {
      process.kill(browserPid)
    }

  }
);

