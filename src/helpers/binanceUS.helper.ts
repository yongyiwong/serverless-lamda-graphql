import axios from "axios";
import * as crypto from "crypto";
import * as querystring from "querystring";

import config from "../config";

const _getHttp = async (apiKey: string, secretKey: string, path: string, args: any, headers: any) => {
    let params = "";
    if (args && Object.keys(args).length) {
      params = "?" + extendQuery(secretKey, querystring.stringify(args));
    }
    
    let url = config.binanceUS.baseURI + path + params;
  
    const options = _generateReqOptions(
      url,
      null,
      "GET",
      headers
    );
  
    try {
      const result = await axios.get(options.url, { headers: options.headers });
      return result.data;
    } catch (err) {
      console.error(err);
      return null;
    }
};

const extendQuery = (secretKey: string, query: string ) => {
    const timestamp = `timestamp=${Date.now()}`;
    const recvWindow = `recvWindow=6000`;
    let extendedQuery = timestamp + `&` + recvWindow + query;
    const signature = _generateSignature( secretKey, extendedQuery );
    extendedQuery += '&' + signature;
    return extendedQuery;
}
const _generateSignature = (
    secretKey: string,
    query: string
  ) => {
    try {
      const signature = crypto
        .createHmac("sha256", Buffer.from(secretKey, "base64"))
        .update(query)
        .digest("base64");

      return signature;  
    } catch (err) {
      console.log(err);
      return null;
    }
};

const _generateReqOptions = (
    url: string,
    body: any,
    method: string,
    headers: any,
  ) => {
    const bodyStr = body ? JSON.stringify(body) : "";
  
    // specify the options
    const options = {
      url: url,
      // 'ca': this.caFile,
      strictSSL: false,
      body: bodyStr,
      method: method,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
    };
  
    options.headers = Object.assign(options.headers, headers);
    options.headers = Object.assign(options.headers, {
        "X-MBX-APIKEY": "Ihwqnd0hAS40MAahLjQ5zm4W3M7WBmIgVq5URZSWcj4RkacXcdGxJMFlhcgizxI9"
      });
  
    return options;
  };

  const getBalanceByUser = async (apiKey: string, secretKey: string ) => {
    const accounts = [];
    let path = "/account";
    const result = await _getHttp(apiKey, secretKey, path, {}, {});
    return result;
  };

  export default {
    getBalanceByUser,
  };
  