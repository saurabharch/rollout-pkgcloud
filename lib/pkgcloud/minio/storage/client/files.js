/*
 * files.js: Instance methods for working with files from minio S3
 *
 * (C) 2021 Saurabh Kashyap & the Contributors.
 *
 */

var base = require("../../../core/storage"),
  pkgcloud = require("../../../../../lib/pkgcloud"),
  through = require("through2"),
  storage = pkgcloud.providers.minio.storage,
  _ = require("lodash");

//
// ### function removeFile (container, file, callback)
// #### @container {string} Name of the container to destroy the file in
// #### @file {string} Name of the file to destroy.
// #### @callback {function} Continuation to respond to when complete.
// Destroys the `file` in the specified `container`.
//
exports.removeFile = function(container, file, callback) {
  var self = this;

  if (container instanceof storage.Container) {
    container = container.name;
  }

  if (file instanceof storage.File) {
    file = file.name;
  }

  self.s3.removeObject(
    {
      Bucket: container,
      Key: file
    },
    function(err, data) {
      return err ? callback(err) : callback(null, !!data.DeleteMarker);
    }
  );
};

exports.upload = function(options) {
  var self = this;

  // check for deprecated calling with a callback
  if (typeof arguments[arguments.length - 1] === "function") {
    self.emit(
      "log::warn",
      "storage.upload no longer supports calling with a callback"
    );
  }

  var s3Options = {
    Bucket:
      options.container instanceof base.Container
        ? options.container.name
        : options.container,
    Key:
      options.remote instanceof base.File ? options.remote.name : options.remote
  };

  var minioSettings = {
    queueSize: options.queueSize || 1,
    partSize: options.partSize || 5 * 1024 * 1024
  };

  if (options.cacheControl) {
    s3Options.CacheControl = options.cacheControl;
  }

  if (options.contentType) {
    s3Options.ContentType = options.contentType;
  }

  if (options.contentEncoding) {
    s3Options.ContentEncoding = options.contentEncoding;
  }

  // use ACL until a more obvious permission generalization is available
  if (options.acl) {
    s3Options.ACL = options.acl;
  }

  // add minio specific options
  if (options.cacheControl) {
    s3Options.CacheControl = options.cacheControl;
  }

  if (options.ServerSideEncryption) {
    s3Options.ServerSideEncryption = options.ServerSideEncryption;
  }

  // we need a writable stream because minio listens for an error event on writable
  // stream and redirects it to the provided callback - without the writable stream
  // the error would be emitted twice on the returned proxyStream
  var writableStream = through();
  // we need a proxy stream so we can always return a file model
  // via the 'success' event
  var proxyStream = through();

  minioOptions.Body = writableStream;

  var managedUpload = self.s3.fPutObject(minioOptions, minioSettings);

  proxyStream.managedUpload = managedUpload;

  managedUpload.send(function(err, data) {
    if (err) {
      return proxyStream.emit("error", err);
    }
    return proxyStream.emit("success", new storage.File(self, data));
  });

  proxyStream.pipe(writableStream);

  return proxyStream;
};

exports.download = function(options) {
  var self = this;

  return self.s3
    .getObject({
      Bucket:
        options.container instanceof base.Container
          ? options.container.name
          : options.container,
      Key:
        options.remote instanceof base.File
          ? options.remote.name
          : options.remote
    })
    .createReadStream();
};

exports.getFile = function(container, file, callback) {
  var containerName =
      container instanceof base.Container ? container.name : container,
    self = this;

  self.s3.getObject(
    {
      Bucket: containerName,
      Key: file
    },
    function(err, data) {
      return err
        ? callback(err)
        : callback(
            null,
            new storage.File(
              self,
              _.extend(data, {
                container: container,
                name: file
              })
            )
          );
    }
  );
};

exports.getFiles = function(container, options, callback) {
  var containerName =
      container instanceof base.Container ? container.name : container,
    self = this;

  if (typeof options === "function") {
    callback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  var s3Options = {
    Bucket: containerName
  };

  if (options.marker) {
    s3Options.Marker = options.marker;
  }

  if (options.prefix) {
    s3Options.Prefix = options.prefix;
  }

  if (options.maxKeys) {
    s3Options.MaxKeys = options.maxKeys;
  }

  self.s3.listObjects(s3Options, function(err, data) {
    return err
      ? callback(err)
      : callback(
          null,
          self._toArray(data.Contents).map(function(file) {
            file.container = container;
            return new storage.File(self, file);
          }),
          {
            isTruncated: data.IsTruncated,
            marker: data.Marker,
            nextMarker: data.NextMarker
          }
        );
  });
};
