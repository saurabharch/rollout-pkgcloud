var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
var BodyParser = require("body-parser");
var pkgcloud = require("@saurabharch/rollout-pkgcloud"),
  fs = require("fs");
var app = Express();

app.use(BodyParser.json({ limit: "4mb" }));

var minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
});

var client = pkgcloud.storage.createClient({
  provider: "minio",
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
});

app.post(
  "/upload",
  Multer({ storage: Multer.memoryStorage() }).single("upload"),
  function(request, response) {
    minioClient.putObject(
      "rollout",
      request.file.originalname,
      request.file.buffer,
      function(error, etag) {
        if (error) {
          return console.log(error);
        }
        response.send(request.file);
      }
    );
  }
);

app.post(
  "/uploadfile",
  Multer({ dest: "./uploads/" }).single("upload"),
  function(request, response) {
    var readStream = fs.createReadStream("a-file.txt");
    var writeStream = client.upload({
      container: "rollout",
      remote: "remote-file-name.txt"
    });

    writeStream.on("error", function(err) {
      response.status(400).json({ message: err.message });
    });

    writeStream.on("success", function(file) {
      // success, file will be a File model
      response.status(200).json({
        message: file
      });
    });
  }
);

app.get("/download", function(request, response) {
  minioClient.getObject("rollout", request.query.filename, function(
    error,
    stream
  ) {
    if (error) {
      return response.status(500).send(error);
    }
    stream.pipe(response);
  });
});

minioClient.bucketExists("rollout", function(error) {
  if (error) {
    return console.log(error);
  }
  var server = app.listen(3000, function() {
    console.log("Listening on port %s...", server.address().port);
  });
});
