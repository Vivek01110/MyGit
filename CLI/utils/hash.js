import crypto from "crypto";

export const hashContent = (content) => {
  return crypto
    .createHash("sha1")
    .update(content)
    .digest("hex");
};