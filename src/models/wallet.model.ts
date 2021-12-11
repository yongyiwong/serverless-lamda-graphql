import { model, Schema } from "mongoose";

// interfaces
import { IWallet } from "../interfaces/models/wallet";

/**
 * Model to store wallet information
 */
const WalletSchema: Schema = new Schema(
  {
    /** user id */
    user_id: {
      required: true,
      type: String,
    },
    /** wallet account address */
    address: {
      required: true,
      type: String,
    },
    /** type - wallet | exchange */
    integration_type: {
      required: true,
      default: "wallet",
      type: String,
    },
    /** blockchain platform id based on CoinMarketCap */
    platform_id: {
      required: true,
      type: Number,
    },
    /** wallet name */
    name: {
      required: true,
      type: String,
    },
    /** import status */
    import_status: {
      default: "pending",
      enum: ["pending", "importing", "success", "failed"],
      required: true,
      type: String,
    },
    /** all transactions import status */
    all_transactions_status: {
      default: "pending",
      enum: ["pending", "importing", "success", "failed"],
      required: true,
      type: String,
    },
    key: {
      type: String,
    },
    secret: {
      type: String,
    },
    pass_phrase: {
      type: String,
    },
    access_token: {
      type: String,
    },
    refresh_token: {
      type: String,
    },
    token_valid: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

WalletSchema.index(
  { user_id: 1, platform_id: 1, address: 1 },
  { unique: true }
);

export default model<IWallet>("wallets", WalletSchema);
