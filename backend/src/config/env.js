import dotenv from "dotenv";

dotenv.config();

export const PORT =
  process.env.PORT || 5000;

export const MONGODB_URI =
  process.env.MONGODB_URI;

export const JWT_SECRET_KEY =
  process.env.JWT_SECRET_KEY;

export const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "1h";


export const B2_ENDPOINT =
  process.env.B2_ENDPOINT;

export const B2_REGION =
  process.env.B2_REGION;

export const B2_BUCKET_NAME =
  process.env.B2_BUCKET_NAME;

export const B2_KEY_ID =
  process.env.B2_KEY_ID;

export const B2_APPLICATION_KEY =
  process.env.B2_APPLICATION_KEY;