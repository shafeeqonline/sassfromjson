"use strict";

var loaderUtils = require("loader-utils");
var fs = require('fs');
var path = require("path");
module.exports = function(content) {
  var query = loaderUtils.parseQuery(this.query).path;
  var queryString = JSON.stringify(query);
  var keyName = loaderUtils.parseQuery(this.query).keyname;
  var varPath = queryString.replace(/["']/g, '');
  this.cacheable();
  var contentPath = path.resolve(varPath);
  this.addDependency(contentPath);
  var rawobj = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  var findKey = function(fullobject, key) {
      var p, val, tRet;
      var key = key;
      for (p in fullobject) {
        if (p == key) {
          return fullobject[key];
        } else if (fullobject[p] instanceof Object) {
          if (fullobject.hasOwnProperty(p)) {
            tRet = findKey(fullobject[p],key);
            if (tRet) { return tRet; }
          }
        }
      }
    return false;
  };
  var obj = findKey(rawobj, keyName);


  function jsonToSassVars (obj, indent) {
    // Make object root properties into sass variables
    var sass = "";
    for (var key in obj) {
      sass += "$" + key + ":" + JSON.stringify(obj[key], null, indent) + ";\n";
    }

    // Store string values (so they remain unaffected)
    var storedStrings = [];
    sass = sass.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, function (str) {

      var id = "___JTS" + storedStrings.length;
      storedStrings.push({id: id, value: str});
      return id;
    });

    // Convert js lists and objects into sass lists and maps)
    sass = sass.replace(/[{\[]/g, "(").replace(/[}\]]/g, ")");

    // Put string values back (now that we're done converting)
    storedStrings.forEach(function (str) {
      str.value = str.value.replace(/["']/g, '');
      sass = sass.replace(str.id, str.value);
    });

    return sass;
  }


  var sass = jsonToSassVars(obj);

  return sass ? sass + '\n ' + content : content;
}
