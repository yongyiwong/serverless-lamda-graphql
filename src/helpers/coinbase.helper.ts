import axios from "axios";
import * as crypto from "crypto";
import * as querystring from "querystring";

import config from "../config";

const _getHttp = async (path: string, args: any, headers: any, user: any) => {
  let params = "";
  if (args && Object.keys(args).length) {
    params = "?" + querystring.stringify(args);
  }

  let url =
    user.integration_type === "coinBasePro"
      ? config.coinbase.proBaseURI
      : config.coinbase.baseURI;
  url += path + params;

  const options = _generateReqOptions(
    url,
    path + params,
    null,
    "GET",
    headers,
    user
  );

  try {
    const result = await axios.get(options.url, { headers: options.headers });
    return result.data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const _generateSignature = (
  path: string,
  method: string,
  bodyStr: string,
  secret: string
) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = timestamp + method + "/" + path + bodyStr;
    const signature = crypto
      .createHmac("sha256", Buffer.from(secret, "base64"))
      .update(message)
      .digest("base64");

    return {
      digest: signature,
      timestamp: timestamp,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};

const _generateReqOptions = (
  url: string,
  path: string,
  body: any,
  method: string,
  headers: any,
  user: any
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
      Accept: "application/json",
      "User-Agent": "coinbase/node/1.0.4",
      Authorization: null,
    },
  };

  options.headers = Object.assign(options.headers, headers);

  // add additional headers when we're using the "api key" and "api secret"
  if (user.secret && user.key) {
    const sig = _generateSignature(path, method, bodyStr, user.secret);
    // add signature and nonce to the header
    options.headers = Object.assign(options.headers, {
      "CB-ACCESS-SIGN": sig.digest,
      "CB-ACCESS-TIMESTAMP": sig.timestamp,
      "CB-ACCESS-KEY": user.key,
      "CB-ACCESS-PASSPHRASE": user.pass_phrase,
    });
  } else {
    options.headers.Authorization = "Bearer " + user.access_token;
  }
  return options;
};

const getAccessToken = async (code: string): Promise<any> => {
  try {
    const res = await axios.post(config.coinbase.tokenEndpoint, {
      grant_type: "authorization_code",
      code,
      client_id: config.coinbase.clientId,
      client_secret: config.coinbase.clientSecret,
      redirect_uri: config.coinbase.redirectUri,
    });

    if (res.status === 200) {
      return res.data;
    }

    return null;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const refreshAuthToken = async (refreshToken: string): Promise<any> => {
  try {
    const res = await axios.post(config.coinbase.tokenEndpoint, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.coinbase.clientId,
      client_secret: config.coinbase.clientSecret,
      redirect_uri: config.coinbase.redirectUri,
    });

    if (res.status === 200) {
      return res.data;
    }

    return null;
  } catch (err) {
    if (err.isAxiosError) {
      console.error(err.response.data);
    } else {
      console.log(err);
    }
    return null;
  }
};

const getAccounts = async (user: any) => {
  const basePath = "accounts";
  const accounts = [];
  let next = false;
  let path = "?limit=100";
  do {
    const result = await _getHttp(basePath + path, {}, {}, user);
    if (result) {
      const { data, pagination } = result;
      accounts.push(...data);
      if (pagination && pagination.next_uri) {
        next = true;
        path += `&starting_after=${data[data.length - 1].id}`;
      } else {
        next = false;
      }
    }

    // wait to not hit rate limits
    if (next) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } while (next);

  return accounts;
};

const getTransactions = async (accountId: string, user: any): Promise<any> => {
  const basePath = `accounts/${accountId}/transactions`;
  const transactions = [];
  let next = false;
  let path = "?limit=100";

  do {
    const result = await _getHttp(basePath + path, {}, {}, user);

    if (result) {
      const { data, pagination } = result;
      transactions.push(...data);

      if (pagination && pagination.next_uri) {
        next = true;
        path += `&starting_after=${data[data.length - 1].id}`;
      } else {
        next = false;
      }
    }

    // wait to not hit rate limits
    if (next) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } while (next);

  return transactions;
};

export default {
  getAccessToken,
  getAccounts,
  getTransactions,
  refreshAuthToken,
};
