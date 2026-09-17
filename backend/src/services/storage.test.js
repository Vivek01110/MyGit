import {
  uploadObject,
  getObject,
  deleteObject
} from "./storage.service.js";


const test = async () => {

  console.log("Uploading test object...");


  await uploadObject({
    key: "test/hello.txt",

    body: "Hello from MyGit!",

    contentType: "text/plain"
  });


  console.log("Upload successful.");


  const object =
    await getObject(
      "test/hello.txt"
    );


  console.log(
    "Download successful."
  );


  const text =
    await object.Body.transformToString();


  console.log(
    "Content:",
    text
  );


  await deleteObject(
    "test/hello.txt"
  );


  console.log(
    "Delete successful."
  );
};


test().catch((error) => {
  console.error(
    "B2 test failed:",
    error
  );
});