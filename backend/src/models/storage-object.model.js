import mongoose from "mongoose";

const storageObjectSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    body: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: "text/plain"
    }
  },
  {
    timestamps: true
  }
);

const StorageObject =
  mongoose.models.StorageObject ||
  mongoose.model("StorageObject", storageObjectSchema);

export default StorageObject;
