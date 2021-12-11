import { v4 as uuid } from "uuid";
import binanceUsHelper from "../../helpers/binanceUS.helper";

let moment = require("moment");
if ("default" in moment) {
  moment = moment["default"];
}

const getBalance = async ( apiKey: string, secretKey: string ) => {
  await binanceUsHelper.getBalanceByUser( apiKey, secretKey );
}