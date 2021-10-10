## Using minio s3 provider in pkgcloud

The minio provider in pkgcloud supports the following services:

* **Storage** S3 (Simple Storage Service)

### Client Creation

For all of the Amazon services, you create a client with the same options:

```Javascript
var client = require('pkgcloud').compute.createClient({
    provider:'minio'// provider name
    endPoint: 'play.minio.io', //minio endpoint
    port: 9000, //minio endpoint port
    useSSL: false, // true or false
    accessKey: 'access-key', // minio access key
    secretKey: 'secret-key', // minio secretkey
    region: 'us-east-1', // region for aws storage with minio
    transport:'',  // 
    sessionToken:'', 
    partSize:'100mb' // multipart storage limit
});
```

```Javascript
var client = require('pkgcloud').storage.createClient({
    provider:'minio'// provider name
    endPoint: 'play.minio.io', //minio endpoint
    port: 9000, //minio endpoint port
    useSSL: false, // true or false
    accessKey: 'access-key', // minio access key
    secretKey: 'secret-key', // minio secretkey
});
```
### File upload

Whether s3 `multipart-upload` or `putObject` API  is used depends on the `partSize` option value and the size of file being uploaded.
Single `putObject` request is made if an object being uploaded is not large enough. if the object size exceeds defined `partSize`, it uses `multipart-upload` API


```Javascript
var readableStream = fs.createReadStream('./path/to/file');

var writableStream = client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: 'web-static',
    remote: 'image.jpg'
});

//writableStream.managedUpload === https://docs.min.io/docs/javascript-client-quickstart-guide.html
// managedUpload object allows you to abort ongoing upload or track file upload progress.

readableStream.pipe(writableStream)
.on('success', function(file) {
    console.log(file);
}).on('error', function(err) {
    console.log(err);
});
```
