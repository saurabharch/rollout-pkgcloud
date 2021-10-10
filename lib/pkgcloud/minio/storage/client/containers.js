/*
 * containers.js: Instance methods for working with containers from Minio S3
 *
 * (C) 2021 Saurabh Kashyap & the Contributors.
 *
 */

var async = require("async"),
  pkgcloud = require("../../../../../lib/pkgcloud"),
  storage = pkgcloud.providers.minio.storage;

//
// ### function getContainers (callback)
// #### @callback {function} Continuation to respond to when complete.
// Gets all minio S3 containers for this instance.
//
exports.getContainers = function(callback) {
  var self = this;

  self.s3.listBuckets(function(err, data) {
    if (err) {
      callback(err);
      return;
    }

    var containers = data.Buckets;

    containers = containers.map(function(container) {
      return new storage.Container(self, container);
    });

    callback(err, containers);
  });
};

//
// ### function getContainer (container, callback)
// #### @container {string|storage.Container} Name of the container to return
// #### @callback {function} Continuation to respond to when complete.
// Responds with the minio S3 container for the specified
// `container`.
//
exports.getContainer = function(container, callback) {
  var containerName =
      container instanceof storage.Container ? container.name : container,
    self = this;

  self.s3.listObjects(
    {
      Bucket: containerName
    },
    function(err, data) {
      return err
        ? callback(err)
        : callback(null, new storage.Container(self, data));
    }
  );
};

//
// ### function createContainer (options, callback)
// #### @options {string|Container} Container to create in minio S3.
// #### @callback {function} Continuation to respond to when complete.
// Creates the specified `container` in minio S3 account associated
// with this instance.
//
exports.createContainer = function(options, callback) {
  var containerName =
      options instanceof storage.Container ? options.name : options,
    self = this;

  self.s3.makeBucket(
    {
      Bucket: containerName
    },
    function(err) {
      return err
        ? callback(err)
        : callback(null, new storage.Container(self, options));
    }
  );
};

//
// ### function destroyContainer (container, callback)
// #### @container {string} Name of the container to destroy
// #### @callback {function} Continuation to respond to when complete.
// Destroys the specified `container` and all files in it.
//
exports.destroyContainer = function(container, callback) {
  var containerName =
      container instanceof storage.Container ? container.name : container,
    self = this;

  function getPagedFiles(containerName, marker, callback) {
    var options = {};

    if (marker) {
      options.marker = marker;
    }

    self.s3.listObjects(containerName, marker, callback);
  }

  function deleteContainer(err) {
    if (err) {
      return callback(err);
    }

    self.removeBucket(
      {
        Bucket: containerName
      },
      function(err) {
        return err ? callback(err) : callback(null, true);
      }
    );
  }

  function destroyFile(file, next) {
    file.remove(next);
  }

  function deleteFiles(files, next) {
    async.forEachLimit(files, 10, destroyFile, next);
  }

  function handleResponse(err, files, meta) {
    if (err) {
      return callback(err);
    }

    if (meta.isTruncated) {
      deleteFiles(files, function(err) {
        if (err) {
          callback(err);
          return;
        }

        getPagedFiles(
          containerName,
          files[files.length - 1].name,
          handleResponse
        );
      });
      return;
    }

    deleteFiles(files, deleteContainer);
  }

  getPagedFiles(containerName, handleResponse);
};
