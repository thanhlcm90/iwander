/**
 * Index of object within an array
 *
 * @param {Array} arr
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.indexof = function(arr, obj) {
  var index = -1; // not found initially
  var keys = Object.keys(obj);
  // filter the collection with the given criterias
  var result = arr.filter(function(doc, idx) {
    // keep a counter of matched key/value pairs
    var matched = 0;

    // loop over criteria
    for (var i = keys.length - 1; i >= 0; i--) {
      if (doc[keys[i]] === obj[keys[i]]) {
        matched++;

        // check if all the criterias are matched
        if (matched === keys.length) {
          index = idx;
          return idx;
        }
      }
    };
  });
  return index;
}

/**
 * Check param page is correct, if it is not number, return 0. If it is number, minus 1
 *
 * @return {Number}
 * @api public
 */
exports.checkPage = function(page) {
  if (page && typeof page === 'number') {
    if (page > 0) {
      page--;
    } else {
      page = 0;
    }
  } else {
    page = 0;
  }
  return page;
}

/**
 * Check param is number
 *
 * @return {Number}
 * @api public
 */
exports.checkNumber = function(num) {
  if (num) {
    return num;
  } else {
    num = 0;
  }
  return num;
}

/**
 * Check data is null
 *
 * @return boolean
 * @api public
 */
exports.checkNotNull = function(data) {
  if (data) {
    if (typeof data === 'number') {
      return true;
    } else if (typeof data === 'string' && data.length) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}