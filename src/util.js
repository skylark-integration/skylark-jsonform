define([
  "skylark-langx",
  "./jsonform"
],function(langx,jsonform){

  //1519-1653
  //1656-1684
  //1725-1775

    /**
   * Regular expressions used to extract array indexes in input field names
   */
  var reArray = /\[([0-9]*)\](?=\[|\.|$)/g;

    /**
     * Template settings for form views
     */
    var fieldTemplateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g
    };

    /**
     * Template settings for value replacement
     */
    var valueTemplateSettings = {
      evaluate    : /\{\[([\s\S]+?)\]\}/g,
      interpolate : /\{\{([\s\S]+?)\}\}/g
    };


    /**
     * Returns true if given property is directly property of an object
     */
    var hasOwnProperty = function (obj, prop) {
      return typeof obj === 'object' && obj.hasOwnProperty(prop);
    }

  /**
   * Escapes selector name for use with jQuery
   *
   * All meta-characters listed in jQuery doc are escaped:
   * http://api.jquery.com/category/selectors/
   *
   * @function
   * @param {String} selector The jQuery selector to escape
   * @return {String} The escaped selector.
   */
  var escapeSelector = function (selector) {
    return selector.replace(/([ \!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '\\$1');
  };

  /**
   *
   * Slugifies a string by replacing spaces with _. Used to create
   * valid classnames and ids for the form.
   *
   * @function
   * @param {String} str The string to slugify
   * @return {String} The slugified string.
   */
  var slugify = function(str) {
    return str.replace(/\ /g, '_');
  }


  /**
   * Returns true if given value is neither "undefined" nor null
   */
  var isSet = function (value) {
    return !(langx.isUndefined(value) || langx.isNull(value));
  };



  //Allow to access subproperties by splitting "."
  /**
   * Retrieves the key identified by a path selector in the structured object.
   *
   * Levels in the path are separated by a dot. Array items are marked
   * with [x]. For instance:
   *  foo.bar[3].baz
   *
   * @function
   * @param {Object} obj Structured object to parse
   * @param {String} key Path to the key to retrieve
   * @param {boolean} ignoreArrays True to use first element in an array when
   *   stucked on a property. This parameter is basically only useful when
   *   parsing a JSON schema for which the "items" property may either be an
   *   object or an array with one object (only one because JSON form does not
   *   support mix of items for arrays).
   * @return {Object} The key's value.
   */
  var getObjKey = function (obj, key, ignoreArrays) {
    var innerobj = obj;
    var keyparts = key.split(".");
    var subkey = null;
    var arrayMatch = null;
    var prop = null;

    for (var i = 0; i < keyparts.length; i++) {
      if ((innerobj === null) || (typeof innerobj !== "object")) return null;
      subkey = keyparts[i];
      prop = subkey.replace(reArray, '');
      reArray.lastIndex = 0;
      arrayMatch = reArray.exec(subkey);
      if (arrayMatch) {
        while (true) {
          if (prop && !langx.isArray(innerobj[prop])) return null;
          innerobj = prop ? innerobj[prop][parseInt(arrayMatch[1])] : innerobj[parseInt(arrayMatch[1])];
          arrayMatch = reArray.exec(subkey);
          if (!arrayMatch) break;
          // In the case of multidimensional arrays,
          // we should not take innerobj[prop][0] anymore,
          // but innerobj[0] directly
          prop = null;
        }
      } else if (ignoreArrays &&
          !innerobj[prop] &&
          langx.isArray(innerobj) &&
          innerobj[0]) {
        innerobj = innerobj[0][prop];
      } else {
        innerobj = innerobj[prop];
      }
    }

    if (ignoreArrays && langx.isArray(innerobj) && innerobj[0]) {
      return innerobj[0];
    } else {
      return innerobj;
    }
  };


  /**
   * Sets the key identified by a path selector to the given value.
   *
   * Levels in the path are separated by a dot. Array items are marked
   * with [x]. For instance:
   *  foo.bar[3].baz
   *
   * The hierarchy is automatically created if it does not exist yet.
   *
   * @function
   * @param {Object} obj The object to build
   * @param {String} key The path to the key to set where each level
   *  is separated by a dot, and array items are flagged with [x].
   * @param {Object} value The value to set, may be of any type.
   */
  var setObjKey = function(obj,key,value) {
    var innerobj = obj;
    var keyparts = key.split(".");
    var subkey = null;
    var arrayMatch = null;
    var prop = null;

    for (var i = 0; i < keyparts.length-1; i++) {
      subkey = keyparts[i];
      prop = subkey.replace(reArray, '');
      reArray.lastIndex = 0;
      arrayMatch = reArray.exec(subkey);
      if (arrayMatch) {
        // Subkey is part of an array
        while (true) {
          if (!langx.isArray(innerobj[prop])) {
            innerobj[prop] = [];
          }
          innerobj = innerobj[prop];
          prop = parseInt(arrayMatch[1], 10);
          arrayMatch = reArray.exec(subkey);
          if (!arrayMatch) break;
        }
        if ((typeof innerobj[prop] !== 'object') ||
          (innerobj[prop] === null)) {
          innerobj[prop] = {};
        }
        innerobj = innerobj[prop];
      }
      else {
        // "Normal" subkey
        if ((typeof innerobj[prop] !== 'object') ||
          (innerobj[prop] === null)) {
          innerobj[prop] = {};
        }
        innerobj = innerobj[prop];
      }
    }

    // Set the final value
    subkey = keyparts[keyparts.length - 1];
    prop = subkey.replace(reArray, '');
    reArray.lastIndex = 0;
    arrayMatch = reArray.exec(subkey);
    if (arrayMatch) {
      while (true) {
        if (!langx.isArray(innerobj[prop])) {
          innerobj[prop] = [];
        }
        innerobj = innerobj[prop];
        prop = parseInt(arrayMatch[1], 10);
        arrayMatch = reArray.exec(subkey);
        if (!arrayMatch) break;
      }
      innerobj[prop] = value;
    }
    else {
      innerobj[prop] = value;
    }
  };

  /**
   * Retrieves the key definition from the given schema.
   *
   * The key is identified by the path that leads to the key in the
   * structured object that the schema would generate. Each level is
   * separated by a '.'. Array levels are marked with []. For instance:
   *  foo.bar[].baz
   * ... to retrieve the definition of the key at the following location
   * in the JSON schema (using a dotted path notation):
   *  foo.properties.bar.items.properties.baz
   *
   * @function
   * @param {Object} schema The JSON schema to retrieve the key from
   * @param {String} key The path to the key, each level being separated
   *  by a dot and array items being flagged with [].
   * @return {Object} The key definition in the schema, null if not found.
   */
  var getSchemaKey = function(schema,key) {
    var schemaKey = key
      .replace(/\./g, '.properties.')
      .replace(/\[[0-9]*\]/g, '.items');
    var schemaDef = jsonform.util.getObjKey(schema, schemaKey, true);
    if (schemaDef && schemaDef.$ref) {
      throw new Error('JSONForm does not yet support schemas that use the ' +
        '$ref keyword. See: https://github.com/joshfire/jsonform/issues/54');
    }
    return schemaDef;
  };


  /**
   * Applies the array path to the key path.
   *
   * For instance, if the key path is:
   *  foo.bar[].baz.toto[].truc[].bidule
   * and the arrayPath [4, 2], the returned key will be:
   *  foo.bar[4].baz.toto[2].truc[].bidule
   *
   * @function
   * @param {String} key The path to the key in the schema, each level being
   *  separated by a dot and array items being flagged with [].
   * @param {Array(Number)} arrayPath The array path to apply, e.g. [4, 2]
   * @return {String} The path to the key that matches the array path.
   */
  var applyArrayPath = function (key, arrayPath) {
    var depth = 0;
    if (!key) return null;
    if (!arrayPath || (arrayPath.length === 0)) return key;
    var newKey = key.replace(reArray, function (str, p1) {
      // Note this function gets called as many times as there are [x] in the ID,
      // from left to right in the string. The goal is to replace the [x] with
      // the appropriate index in the new array path, if defined.
      var newIndex = str;
      if (isSet(arrayPath[depth])) {
        newIndex = '[' + arrayPath[depth] + ']';
      }
      depth += 1;
      return newIndex;
    });
    return newKey;
  };

  var max = function(arr) {
    return arr.reduce(function(a, b) {
      return Math.max(a, b);
    });
  };

  function each(arrays,fn) {
    return langx.each(arrays,fn,true);
  }

  return jsonform.util = {
    fieldTemplateSettings,
    valueTemplateSettings,
    each,
    hasOwnProperty,
    escapeSelector,
    slugify,
    isSet,
    applyArrayPath,
    getObjKey,
    setObjKey,
    getSchemaKey,
    max
  };

});
