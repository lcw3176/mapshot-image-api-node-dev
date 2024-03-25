const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const axios = require('axios');

module.exports.handler = async (event, context) => {

  const WIDTH = 1000;
  const domain = "https://dev-api.kmapshot.com";

  let response_arr = []
  
  let token = typeof event.queryStringParameters.AUTH_TOKEN === "undefined" ? null : event.queryStringParameters.AUTH_TOKEN;

  if(token === null){
    return {
      statusCode: 400
    }
  }

  let type = event.queryStringParameters.type;
  let companyType = event.queryStringParameters.companyType;
  let lng = event.queryStringParameters.lng;
  let lat = event.queryStringParameters.lat;
  let level = event.queryStringParameters.level;
  let layerMode = event.queryStringParameters.layerMode;

  const header = {
    'AUTH_TOKEN': token
  }
  
  await chromium.font('/opt/NotoSansKR-Regular.otf');

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,

    defaultViewport: {
      width: WIDTH,
      height: WIDTH
    },

    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders(header);

  await page.goto(domain + `/image/template/` + companyType + `?`
    + `layerMode=` + layerMode
    + `&lat=` + lat
    + `&level=` + level
    + `&lng=` + lng
    + `&type=` + type
    + `&companyType=` + companyType);

  await page.waitForSelector('#checker_true');

  let goal_width;

  if(companyType === 'kakao'){
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
        goal_width = 6000;
        break;
      case '2':
        goal_width = 5000;
        break;
      case '5':
        goal_width = 6000;
        break;
      case '10':
        goal_width = 6000;
        break;
      default:
        goal_width = 0;
        break;
    }
  }
 
  let count = 0;
  let total_count = parseInt(goal_width / WIDTH) * parseInt(goal_width / WIDTH);

  for (let y = 0; y < goal_width; y += WIDTH) {
    for (let x = 0; x < goal_width; x += WIDTH) {

      await page.evaluate((_x, _y) => {
        window.scroll(_x, _y);
      }, x, y);

      let imageBuffer = await page.screenshot({
        type: "jpeg"
      });

      let gen_uuid = uuidv4();

      
      axios.post(domain + "/image/storage", {
        "uuid": gen_uuid,
        "base64EncodedImage": imageBuffer.toString('base64'),
      }, {
        headers: header
      })
      .then(function (response) {
        count++;
      })
      .catch(function (error) {
        count++;
      });;

    
      let response = {
        "uuid": gen_uuid,
        "x": x,
        "y": y
      };

    
      response_arr.push(response);

    }
  }


  let browserPid = browser.process()?.pid

  if (browserPid) {
      process.kill(browserPid)
  }
  
  function waitForCondition() {
    return new Promise(resolve => {
      function checkFlag() {
        if (total_count === count) {
          resolve();
        } else {
          setTimeout(checkFlag, 100); 
        }
      }
      checkFlag();
    });
  }

  await waitForCondition();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'dev-api.kmapshot.com',
    },
    
    body: JSON.stringify(response_arr)
  }

}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


