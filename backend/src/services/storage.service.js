import StorageObject from "../models/storage-object.model.js";

// Helper: convert any body (Buffer, String, etc.) to string for database storage
const bodyToString = (body) => {
  if (Buffer.isBuffer(body)) {
    return body.toString("utf-8");
  }
  if (typeof body === "string") {
    return body;
  }
  return String(body);
};

// ---------------------------------------
// Upload object (stores directly in MongoDB)
// ---------------------------------------
export const uploadObject = async ({
  key,
  body,
  contentType
}) => {
  const bodyStr = bodyToString(body);

  await StorageObject.findOneAndUpdate(
    { key },
    { key, body: bodyStr, contentType: contentType || "application/octet-stream" },
    { upsert: true, returnDocument: "after" }
  );

  return key;
};

// ---------------------------------------
// Get object
// ---------------------------------------
export const getObject = async (key) => {
  const dbObj = await StorageObject.findOne({ key });
  if (dbObj) {
    return {
      ContentType: dbObj.contentType,
      Body: {
        transformToString: async () => dbObj.body
      }
    };
  }

  const notFoundError = new Error("Object not found");
  notFoundError.name = "NotFound";
  notFoundError.$metadata = { httpStatusCode: 404 };
  throw notFoundError;
};

// ---------------------------------------
// Delete object
// ---------------------------------------
export const deleteObject = async (key) => {
  await StorageObject.deleteOne({ key });
};

// ---------------------------------------
// List objects by prefix
// ---------------------------------------
export const listObjects = async (prefix) => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const dbObjs = await StorageObject.find({
    key: { $regex: `^${escapedPrefix}` }
  });

  return dbObjs.map((obj) => ({
    Key: obj.key
  }));
};

// ---------------------------------------
// Delete multiple objects
// ---------------------------------------
export const deleteObjects = async (keys) => {
  if (!keys.length) return;
  await StorageObject.deleteMany({ key: { $in: keys } });
};

// ---------------------------------------
// Check object exists
// ---------------------------------------
export const objectExists = async (key) => {
  const dbObj = await StorageObject.findOne({ key });
  return !!dbObj;
};