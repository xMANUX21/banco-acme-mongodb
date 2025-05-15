import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const DBURL = process.env.DBURL;
export const DBNAME = process.env.DBNAME;

const client = new MongoClient(DBURL);

export const main = async () => {
  await client.connect();
  console.log("✅ Conectado a la base de datos");
  return client.db(DBNAME);
};