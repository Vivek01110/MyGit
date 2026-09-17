import {
  S3Client
} from "@aws-sdk/client-s3";

import {
  B2_ENDPOINT,
  B2_REGION,
  B2_KEY_ID,
  B2_APPLICATION_KEY
} from "./env.js";


const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,

  region: B2_REGION,

  forcePathStyle: true,

  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY
  }
});


export default b2Client;