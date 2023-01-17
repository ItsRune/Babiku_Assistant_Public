const HeadersAllowed = [
    "Roblox",
    "Postman"
  ]
  
  function headerCheck(req, res, next) {
    const headers = req.headers;
    const userAgent = headers["user-agent"];
    let good = false;
    
    for (let i = 0; i < HeadersAllowed.length; i++) {
      if (userAgent.toLowerCase().includes(HeadersAllowed[i].toLowerCase())) {
        good = true;
        break;
      }
    };
  
    if (good == false)
      return res.json({Success:false, errorMessage: "Not authorized."});
  
    next();
  };
  
  module.exports = headerCheck;