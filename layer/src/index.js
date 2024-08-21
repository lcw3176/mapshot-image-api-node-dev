const axios = require('axios');

module.exports.handler = async (event, context) => {
    

    if(isEmpty(event.headers.origin)){
      return {
        statusCode: 400
      }
    }

    let domain = event.headers.origin;
    
    const verified = process.env.DOMAIN_NAMES.toString().split(",")
    
    if(!verified.includes(domain)){
      return {
        statusCode : 401
      }
    }
    
    let layers = event.queryStringParameters.layer;
    
    let yMin = event.queryStringParameters.ymin;
    let xMin = event.queryStringParameters.xmin;
    let yMax = event.queryStringParameters.ymax;  
    let xMax = event.queryStringParameters.xmax;
    
    let height = event.queryStringParameters.height;
    
    let url =  "http://api.vworld.kr/req/wms?" 
                + "SERVICE=WMS&"
                + "REQUEST=GetMap&"
                + "VERSION=1.3.0&"
                + "LAYERS=" + layers + "&"
                + "STYLES=" + layers + "&"
                + "CRS=EPSG:4326&"
                + "BBOX=" +  yMin  + "," + xMin + "," + yMax + "," + xMax + "&"
                + "WIDTH=1000&"
                + "HEIGHT=" + height + "&"
                + "FORMAT=image/png&"
                + "TRANSPARENT=true&"
                + "BGCOLOR=0xFFFFFF&"
                + "EXCEPTIONS=application/json&"
                + "KEY=F6C38A5E-8266-396F-88EF-BA3F1E7E268F&"
                + "DOMAIN=https://kmapshot.com"
    
    let image = await axios.get(url, 
            { responseType: 'arraybuffer' })
        .then((response) => Buffer.from(response.data, 'binary').toString('base64'))
        .catch((error) => {
          // 에러처리
        })
   
    const response = {
        statusCode: 200,
        body: image,
        isBase64Encoded: true,
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin" : domain,
        },
    
    };
    
    return response;

};


function isEmpty(input) {
  return typeof input === "undefined" ||
    input === null ||
    input === "" ||
    input === "null" ||
    input.length === 0 ||
    (typeof input === "object" && !Object.keys(input).length);
}

