import Repository from "../models/repository.model.js";

import {
  uploadObject,
  listObjects,
  deleteObjects
} from "./storage.service.js";

export const createRepository = async ({
  name,
  description,
  visibility = "public",
  language = "JavaScript",
  topics = [],
  ownerId
}) => {
  let repository = null;

  try {
    repository = await Repository.create({
      name,
      description,
      visibility,
      language,
      topics,
      owner: ownerId,
      storagePrefix: "pending"
    });

    const storagePrefix = `repositories/${repository._id}/`;
    repository.storagePrefix = storagePrefix;
    await repository.save();

    await uploadObject({
      key: `${storagePrefix}HEAD`,
      body: `ref: refs/heads/${repository.defaultBranch}`,
      contentType: "text/plain"
    });

    await uploadObject({
      key: `${storagePrefix}refs/heads/${repository.defaultBranch}`,
      body: "",
      contentType: "text/plain"
    });

    return repository;
  } catch (error) {
    if (repository?._id) {
      await Repository.findByIdAndDelete(repository._id);
    }
    throw error;
  }
};

export const updateRepository = async ({
  repositoryId,
  ownerId,
  name,
  description,
  visibility,
  language,
  topics
}) => {
  const repository = await Repository.findOne({
    _id: repositoryId,
    owner: ownerId
  });

  if (!repository) {
    throw new Error("Repository not found or you are not the owner.");
  }

  if (name !== undefined && name.trim()) {
    repository.name = name.trim();
  }
  if (description !== undefined) {
    repository.description = description.trim();
  }
  if (visibility !== undefined) {
    repository.visibility = visibility.toLowerCase();
  }
  if (language !== undefined) {
    repository.language = language;
  }
  if (topics !== undefined && Array.isArray(topics)) {
    repository.topics = topics;
  }

  await repository.save();
  return repository;
};

export const deleteRepository = async ({
  repositoryId,
  ownerId
}) => {
  const repository = await Repository.findOne({
    _id: repositoryId,
    owner: ownerId
  });

  if (!repository) {
    throw new Error("Repository not found or you are not the owner.");
  }

  // Delete all Backblaze B2 storage objects under prefix
  try {
    const objects = await listObjects(repository.storagePrefix);
    const keys = objects.map((object) => object.Key);
    if (keys.length > 0) {
      await deleteObjects(keys);
    }
  } catch (storageError) {
    console.warn("Storage deletion warning:", storageError.message);
  }

  // Delete repository record in MongoDB
  await Repository.findByIdAndDelete(repositoryId);

  return repository;
};

export const getPublicRepositories = async ({
  search = "",
  limit = 50,
  skip = 0
} = {}) => {
  const query = { visibility: "public" };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const repositories = await Repository.find(query)
    .populate("owner", "username email")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Repository.countDocuments(query);

  return { repositories, total };
};