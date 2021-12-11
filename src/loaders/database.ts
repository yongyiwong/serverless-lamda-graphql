import { connect, ConnectionOptions } from "mongoose";

import config from "../config";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string|undefined = config.databaseURL;
console.log('Database connection here');    
console.log( process.env.MONGODB_URI );    
    const options: ConnectionOptions = {
      useCreateIndex: true,
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    if( !mongoURI ){
      throw( 'Wrong Database Configuration');
    }
    await connect(mongoURI, options);
    console.log("MongoDB Connected!");
  } catch (err) {
    console.error(err);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
