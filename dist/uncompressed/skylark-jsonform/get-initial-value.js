define([
  "skylark-langx",
  "./jsonform",
  "./util"
],function(langx,jsonform,util){
  //1758-1881
  /**
   * Returns the initial value that a field identified by its key
   * should take.
   *
   * The "initial" value is defined as:
   * 1. the previously submitted value if already submitted
   * 2. the default value defined in the layout of the form
   * 3. the default value defined in the schema
   *
   * The "value" returned is intended for rendering purpose,
   * meaning that, for fields that define a titleMap property,
   * the function returns the label, and not the intrinsic value.
   *
   * The function handles values that contains template strings,
   * e.g. {{values.foo[].bar}} or {{idx}}.
   *
   * When the form is a string, the function truncates the resulting string
   * to meet a potential "maxLength" constraint defined in the schema, using
   * "..." to mark the truncation. Note it does not validate the resulting
   * string against other constraints (e.g. minLength, pattern) as it would
   * be hard to come up with an automated course of action to "fix" the value.
   *
   * @function
   * @param {Object} formObject The JSON Form object
   * @param {String} key The generic key path (e.g. foo[].bar.baz[])
   * @param {Array(Number)} arrayPath The array path that identifies
   *  the unique value in the submitted form (e.g. [1, 3])
   * @param {Object} tpldata Template data object
   * @param {Boolean} usePreviousValues true to use previously submitted values
   *  if defined.
   */
  var getInitialValue = function (formObject, key, arrayPath, tpldata, usePreviousValues) {
    var value = null;

    // Complete template data for template function
    tpldata = tpldata || {};
    tpldata.idx = tpldata.idx ||
      (arrayPath ? arrayPath[arrayPath.length-1] : 1);
    tpldata.value = util.isSet(tpldata.value) ? tpldata.value : '';
    tpldata.getValue = tpldata.getValue || function (key) {
      return getInitialValue(formObject, key, arrayPath, tpldata, usePreviousValues);
    };

    // Helper function that returns the form element that explicitly
    // references the given key in the schema.
    var getFormElement = function (elements, key) {
      var formElement = null;
      if (!elements || !elements.length) return null;
      util.each(elements, function (elt) {
        if (formElement) return;
        if (elt === key) {
          formElement = { key: elt };
          return;
        }
        if (langx.isString(elt)) return;
        if (elt.key === key) {
          formElement = elt;
        }
        else if (elt.items) {
          formElement = getFormElement(elt.items, key);
        }
      });
      return formElement;
    };
    var formElement = getFormElement(formObject.form || [], key);
    var schemaElement = util.getSchemaKey(formObject.schema.properties, key);

    if (usePreviousValues && formObject.value) {
      // If values were previously submitted, use them directly if defined
      value = util.getObjKey(formObject.value, util.applyArrayPath(key, arrayPath));
    }
    if (!util.isSet(value)) {
      if (formElement && (typeof formElement['value'] !== 'undefined')) {
        // Extract the definition of the form field associated with
        // the key as it may override the schema's default value
        // (note a "null" value overrides a schema default value as well)
        value = formElement['value'];
      }
      else if (schemaElement) {
        // Simply extract the default value from the schema
        if (util.isSet(schemaElement['default'])) {
          value = schemaElement['default'];
        }
      }
      if (value && value.indexOf('{{values.') !== -1) {
        // This label wants to use the value of another input field.
        // Convert that construct into {{getValue(key)}} for
        // Underscore to call the appropriate function of formData
        // when template gets called (note calling a function is not
        // exactly Mustache-friendly but is supported by Underscore).
        value = value.replace(
          /\{\{values\.([^\}]+)\}\}/g,
          '{{getValue("$1")}}');
      }
      if (value) {
        value = langx.template(value, valueTemplateSettings)(tpldata);
      }
    }

    // TODO: handle on the formElement.options, because user can setup it too.
    // Apply titleMap if needed
    if (isSet(value) && formElement && util.hasOwnProperty(formElement.titleMap, value)) {
      value = langx.template(formElement.titleMap[value], valueTemplateSettings)(tpldata);
    }

    // Check maximum length of a string
    if (value && _.isString(value) &&
      schemaElement && schemaElement.maxLength) {
      if (value.length > schemaElement.maxLength) {
        // Truncate value to maximum length, adding continuation dots
        value = value.substr(0, schemaElement.maxLength - 1) + '…';
      }
    }

    if (!util.isSet(value)) {
      return null;
    }
    else {
      return value;
    }
  };

  return jsonform.getInitialValue = getInitialValue;

});
