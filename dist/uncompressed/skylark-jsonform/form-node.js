define([
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-funcs",
  "skylark-langx-arrays",
  "skylark-langx-strings",
  "skylark-langx",
  "skylark-jquery",
  "./jsonform",
  "./util"
],function(types,objects,funcs,arrays,strings,langx,$,jsonform,util){


  //1686-1725
  //1881-3097
  /**
   * Truncates the key path to the requested depth.
   *
   * For instance, if the key path is:
   *  foo.bar[].baz.toto[].truc[].bidule
   * and the requested depth is 1, the returned key will be:
   *  foo.bar[].baz.toto
   *
   * Note the function includes the path up to the next depth level.
   *
   * @function
   * @param {String} key The path to the key in the schema, each level being
   *  separated by a dot and array items being flagged with [].
   * @param {Number} depth The array depth
   * @return {String} The path to the key truncated to the given depth.
   */
  var truncateToArrayDepth = function (key, arrayDepth) {
    var depth = 0;
    var pos = 0;
    if (!key) return null;

    if (arrayDepth > 0) {
      while (depth < arrayDepth) {
        pos = key.indexOf('[]', pos);
        if (pos === -1) {
          // Key path is not "deep" enough, simply return the full key
          return key;
        }
        pos = pos + 2;
        depth += 1;
      }
    }

    // Move one step further to the right without including the final []
    pos = key.indexOf('[]', pos);
    if (pos === -1) return key;
    else return key.substring(0, pos);
  };


  /**
   * Represents a node in the form.
   *
   * Nodes that have an ID are linked to the corresponding DOM element
   * when rendered
   *
   * Note the form element and the schema elements that gave birth to the
   * node may be shared among multiple nodes (in the case of arrays).
   *
   * @class
   */
  var formNode = function () {
    /**
     * The node's ID (may not be set)
     */
    this.id = null;

    /**
     * The node's key path (may not be set)
     */
    this.key = null;

    /**
     * DOM element associated witht the form element.
     *
     * The DOM element is set when the form element is rendered.
     */
    this.el = null;

    /**
     * Link to the form element that describes the node's layout
     * (note the form element is shared among nodes in arrays)
     */
    this.formElement = null;

    /**
     * Link to the schema element that describes the node's value constraints
     * (note the schema element is shared among nodes in arrays)
     */
    this.schemaElement = null;

    /**
     * Pointer to the "view" associated with the node, typically the right
     * object in jsonform.elementTypes
     */
    this.view = null;

    /**
     * Node's subtree (if one is defined)
     */
    this.children = [];

    /**
     * A pointer to the form tree the node is attached to
     */
    this.ownerTree = null;

    /**
     * A pointer to the parent node of the node in the tree
     */
    this.parentNode = null;

    /**
     * Child template for array-like nodes.
     *
     * The child template gets cloned to create new array items.
     */
    this.childTemplate = null;


    /**
     * Direct children of array-like containers may use the value of a
     * specific input field in their subtree as legend. The link to the
     * legend child is kept here and initialized in computeInitialValues
     * when a child sets "valueInLegend"
     */
    this.legendChild = null;


    /**
     * The path of indexes that lead to the current node when the
     * form element is not at the root array level.
     *
     * Note a form element may well be nested element and still be
     * at the root array level. That's typically the case for "fieldset"
     * elements. An array level only gets created when a form element
     * is of type "array" (or a derivated type such as "tabarray").
     *
     * The array path of a form element linked to the foo[2].bar.baz[3].toto
     * element in the submitted values is [2, 3] for instance.
     *
     * The array path is typically used to compute the right ID for input
     * fields. It is also used to update positions when an array item is
     * created, moved around or suppressed.
     *
     * @type {Array(Number)}
     */
    this.arrayPath = [];

    /**
     * Position of the node in the list of children of its parents
     */
    this.childPos = 0;
  };


  /**
   * Clones a node
   *
   * @function
   * @param {formNode} New parent node to attach the node to
   * @return {formNode} Cloned node
   */
  formNode.prototype.clone = function (parentNode) {
    var node = new formNode();
    node.arrayPath = objects.clone(this.arrayPath);
    node.ownerTree = this.ownerTree;
    node.parentNode = parentNode || this.parentNode;
    node.formElement = this.formElement;
    node.schemaElement = this.schemaElement;
    node.view = this.view;
    node.children = arrays.map(this.children,function (child) { 
      return child.clone(node);
    });
    if (this.childTemplate) {
      node.childTemplate = this.childTemplate.clone(node);
    }
    return node;
  };


  /**
   * Returns true if the subtree that starts at the current node
   * has some non empty value attached to it
   */
  formNode.prototype.hasNonDefaultValue = function () {

    // hidden elements don't count because they could make the wrong selectfieldset element active
    if (this.formElement && this.formElement.type=="hidden") {
      return false;
    }

    if (this.value && !this.defaultValue) {
      return true;
    }
    var child = this.children.find(function (child) { //_.find lwf
      return child.hasNonDefaultValue();
    });
    return !!child;
  };


  /**
   * Attaches a child node to the current node.
   *
   * The child node is appended to the end of the list.
   *
   * @function
   * @param {formNode} node The child node to append
   * @return {formNode} The inserted node (same as the one given as parameter)
   */
  formNode.prototype.appendChild = function (node) {
    node.parentNode = this;
    node.childPos = this.children.length;
    this.children.push(node);
    return node;
  };


  /**
   * Removes the last child of the node.
   *
   * @function
   */
  formNode.prototype.removeChild = function () {
    var child = this.children[this.children.length-1];
    if (!child) return;

    // Remove the child from the DOM
    $(child.el).remove();

    // Remove the child from the array
    return this.children.pop();
  };


  /**
   * Moves the user entered values set in the current node's subtree to the
   * given node's subtree.
   *
   * The target node must follow the same structure as the current node
   * (typically, they should have been generated from the same node template)
   *
   * The current node MUST be rendered in the DOM.
   *
   * TODO: when current node is not in the DOM, extract values from formNode.value
   * properties, so that the function be available even when current node is not
   * in the DOM.
   *
   * Moving values around allows to insert/remove array items at arbitrary
   * positions.
   *
   * @function
   * @param {formNode} node Target node.
   */
  formNode.prototype.moveValuesTo = function (node) {
    var values = this.getFormValues(node.arrayPath);
    node.resetValues();
    node.computeInitialValues(values, true);
  };


  /**
   * Switches nodes user entered values.
   *
   * The target node must follow the same structure as the current node
   * (typically, they should have been generated from the same node template)
   *
   * Both nodes MUST be rendered in the DOM.
   *
   * TODO: update getFormValues to work even if node is not rendered, using
   * formNode's "value" property.
   *
   * @function
   * @param {formNode} node Target node
   */
  formNode.prototype.switchValuesWith = function (node) {
    var values = this.getFormValues(node.arrayPath);
    var nodeValues = node.getFormValues(this.arrayPath);
    node.resetValues();
    node.computeInitialValues(values, true);
    this.resetValues();
    this.computeInitialValues(nodeValues, true);
  };


  /**
   * Resets all DOM values in the node's subtree.
   *
   * This operation also drops all array item nodes.
   * Note values are not reset to their default values, they are rather removed!
   *
   * @function
   */
  formNode.prototype.resetValues = function () {
    var params = null;
    var idx = 0;

    // Reset value
    this.value = null;

    // Propagate the array path from the parent node
    // (adding the position of the child for nodes that are direct
    // children of array-like nodes)
    if (this.parentNode) {
      this.arrayPath = objects.clone(this.parentNode.arrayPath);
      if (this.parentNode.view && this.parentNode.view.array) {
        this.arrayPath.push(this.childPos);
      }
    }
    else {
      this.arrayPath = [];
    }

    if (this.view && this.view.inputfield) {
      // Simple input field, extract the value from the origin,
      // set the target value and reset the origin value
      params = $(':input', this.el).serializeArray();
      util.each(params, function (param) {
        // TODO: check this, there may exist corner cases with this approach
        // (with multiple checkboxes for instance)
        $('[name="' + util.escapeSelector(param.name) + '"]', $(this.el)).val('');
      }, this);
    }
    else if (this.view && this.view.array) {
      // The current node is an array, drop all children
      while (this.children.length > 0) {
        this.removeChild();
      }
    }

    // Recurse down the tree
    util.each(this.children, function (child) {
      child.resetValues();
    });
  };


  /**
   * Sets the child template node for the current node.
   *
   * The child template node is used to create additional children
   * in an array-like form element. The template is never rendered.
   *
   * @function
   * @param {formNode} node The child template node to set
   */
  formNode.prototype.setChildTemplate = function (node) {
    this.childTemplate = node;
    node.parentNode = this;
  };


  /**
   * Recursively sets values to all nodes of the current subtree
   * based on previously submitted values, or based on default
   * values when the submitted values are not enough
   *
   * The function should be called once in the lifetime of a node
   * in the tree. It expects its parent's arrayPath to be up to date.
   *
   * Three cases may arise:
   * 1. if the form element is a simple input field, the value is
   * extracted from previously submitted values of from default values
   * defined in the schema.
   * 2. if the form element is an array-like node, the child template
   * is used to create as many children as possible (and at least one).
   * 3. the function simply recurses down the node's subtree otherwise
   * (this happens when the form element is a fieldset-like element).
   *
   * @function
   * @param {Object} values Previously submitted values for the form
   * @param {Boolean} ignoreDefaultValues Ignore default values defined in the
   *  schema when set.
   */
  formNode.prototype.computeInitialValues = function (values, ignoreDefaultValues) {
    var self = this;
    var node = null;
    var nbChildren = 1;
    var i = 0;
    var formData = this.ownerTree.formDesc.tpldata || {};

    // Propagate the array path from the parent node
    // (adding the position of the child for nodes that are direct
    // children of array-like nodes)
    if (this.parentNode) {
      this.arrayPath = objects.clone(this.parentNode.arrayPath);
      if (this.parentNode.view && this.parentNode.view.array) {
        this.arrayPath.push(this.childPos);
      }
    }
    else {
      this.arrayPath = [];
    }

    // Prepare special data param "idx" for templated values
    // (is is the index of the child in its wrapping array, starting
    // at 1 since that's more human-friendly than a zero-based index)
    formData.idx = (this.arrayPath.length > 0) ?
      this.arrayPath[this.arrayPath.length-1] + 1 :
      this.childPos + 1;

    // Prepare special data param "value" for templated values
    formData.value = '';

    // Prepare special function to compute the value of another field
    formData.getValue = function (key) {
      if (!values) {
        return '';
      }
      var returnValue = values;
      var listKey = key.split('[].');
      var i;
      for (i = 0; i < listKey.length - 1; i++) {
        returnValue = returnValue[listKey[i]][self.arrayPath[i]];
      }
      return returnValue[listKey[i]];
    };

    if (this.formElement) {
      // Compute the ID of the field (if needed)
      if (this.formElement.id) {
        this.id = util.applyArrayPath(this.formElement.id, this.arrayPath);
      }
      else if (this.view && this.view.array) {
        this.id = util.escapeSelector(this.ownerTree.formDesc.prefix) +
          '-elt-counter-' + strings.uniqueId();
      }
      else if (this.parentNode && this.parentNode.view &&
        this.parentNode.view.array) {
        // Array items need an array to associate the right DOM element
        // to the form node when the parent is rendered.
        this.id = util.escapeSelector(this.ownerTree.formDesc.prefix) +
          '-elt-counter-' + strings.uniqueId();
      }
      else if ((this.formElement.type === 'button') ||
        (this.formElement.type === 'selectfieldset') ||
        (this.formElement.type === 'question') ||
        (this.formElement.type === 'buttonquestion')) {
        // Buttons do need an id for "onClick" purpose
        this.id =util.escapeSelector(this.ownerTree.formDesc.prefix) +
          '-elt-counter-' + strings.uniqueId();
      }

      // Compute the actual key (the form element's key is index-free,
      // i.e. it looks like foo[].bar.baz[].truc, so we need to apply
      // the array path of the node to get foo[4].bar.baz[2].truc)
      if (this.formElement.key) {
        this.key = util.applyArrayPath(this.formElement.key, this.arrayPath);
        this.keydash = util.slugify(this.key.replace(/\./g, '---'));
      }

      // Same idea for the field's name
      this.name = util.applyArrayPath(this.formElement.name, this.arrayPath);

      // Consider that label values are template values and apply the
      // form's data appropriately (note we also apply the array path
      // although that probably doesn't make much sense for labels...)
      util.each([
        'title',
        'legend',
        'description',
        'append',
        'prepend',
        'inlinetitle',
        'helpvalue',
        'value',
        'disabled',
        'placeholder',
        'readOnly'
      ],  (prop) => {
        if (types.isString(this.formElement[prop])) {
          if (this.formElement[prop].indexOf('{{values.') !== -1) {
            // This label wants to use the value of another input field.
            // Convert that construct into {{jsonform.getValue(key)}} for
            // Underscore to call the appropriate function of formData
            // when template gets called (note calling a function is not
            // exactly Mustache-friendly but is supported by Underscore).
            this[prop] = this.formElement[prop].replace(
              /\{\{values\.([^\}]+)\}\}/g,
              '{{getValue("$1")}}');
          }
          else {
            // Note applying the array path probably doesn't make any sense,
            // but some geek might want to have a label "foo[].bar[].baz",
            // with the [] replaced by the appropriate array path.
            this[prop] = util.applyArrayPath(this.formElement[prop], this.arrayPath);
          }
          if (this[prop]) {
            this[prop] = langx.template(this[prop], util.valueTemplateSettings)(formData);
          }
        }
        else {
          this[prop] = this.formElement[prop];
        }
      });

      // Apply templating to options created with "titleMap" as well
      if (this.formElement.options) {
        this.options = arrays.map(this.formElement.options,function (option) { 
          var title = null;
          if (types.isObject(option) && option.title) {
            // See a few lines above for more details about templating
            // preparation here.
            if (option.title.indexOf('{{values.') !== -1) {
              title = option.title.replace(
                /\{\{values\.([^\}]+)\}\}/g,
                '{{getValue("$1")}}');
            }
            else {
              title = util.applyArrayPath(option.title, self.arrayPath);
            }
            return objects.extend({}, option, {
              value: (util.isSet(option.value) ? option.value : ''),
              title: langx.template(title, util.valueTemplateSettings)(formData)
            });
          }
          else {
            return option;
          }
        });
      }
    }

    if (this.view && this.view.inputfield && this.schemaElement) {
      // Case 1: simple input field
      if (values) {
        // Form has already been submitted, use former value if defined.
        // Note we won't set the field to its default value otherwise
        // (since the user has already rejected it)
        if (util.isSet(util.getObjKey(values, this.key))) {
          this.value = util.getObjKey(values, this.key);
        } else if (util.isSet(this.schemaElement['default'])) {
          // the value is not provided in the values section but the
          // default is set in the schemaElement (which we have)
          this.value = this.schemaElement['default']
          // We only apply a template if it's a string
          if (typeof this.value === 'string') {
            this.value = langx.template(this.value, util.valueTemplateSettings)(formData);
          }

        }
      }
      else if (!ignoreDefaultValues) {
        // No previously submitted form result, use default value
        // defined in the schema if it's available and not already
        // defined in the form element
        if (!util.isSet(this.value) && util.isSet(this.schemaElement['default'])) {
          this.value = this.schemaElement['default'];
          if (types.isString(this.value)) {
            if (this.value.indexOf('{{values.') !== -1) {
              // This label wants to use the value of another input field.
              // Convert that construct into {{jsonform.getValue(key)}} for
              // Underscore to call the appropriate function of formData
              // when template gets called (note calling a function is not
              // exactly Mustache-friendly but is supported by Underscore).
              this.value = this.value.replace(
                /\{\{values\.([^\}]+)\}\}/g,
                '{{getValue("$1")}}');
            }
            else {
              // Note applying the array path probably doesn't make any sense,
              // but some geek might want to have a label "foo[].bar[].baz",
              // with the [] replaced by the appropriate array path.
              this.value = util.applyArrayPath(this.value, this.arrayPath);
            }
            if (this.value) {
              this.value = langx.template(this.value, util.valueTemplateSettings)(formData);
            }
          }
          this.defaultValue = true;
        }
      }
    }
    else if (this.view && this.view.array) {
      // Case 2: array-like node
      nbChildren = 0;
      if (values) {
        nbChildren = this.getPreviousNumberOfItems(values, this.arrayPath);
      }
      // TODO: use default values at the array level when form has not been
      // submitted before. Note it's not that easy because each value may
      // be a complex structure that needs to be pushed down the subtree.
      // The easiest way is probably to generate a "values" object and
      // compute initial values from that object
      /*
      else if (this.schemaElement['default']) {
        nbChildren = this.schemaElement['default'].length;
      }
      */
      else if (nbChildren === 0) {
        // If form has already been submitted with no children, the array
        // needs to be rendered without children. If there are no previously
        // submitted values, the array gets rendered with one empty item as
        // it's more natural from a user experience perspective. That item can
        // be removed with a click on the "-" button.
        nbChildren = 1;
      }
      for (i = 0; i < nbChildren; i++) {
        this.appendChild(this.childTemplate.clone());
      }
    }

    // Case 3 and in any case: recurse through the list of children
    util.each(this.children, function (child) {
      child.computeInitialValues(values, ignoreDefaultValues);
    });

    // If the node's value is to be used as legend for its "container"
    // (typically the array the node belongs to), ensure that the container
    // has a direct link to the node for the corresponding tab.
    if (this.formElement && this.formElement.valueInLegend) {
      node = this;
      while (node) {
        if (node.parentNode &&
          node.parentNode.view &&
          node.parentNode.view.array) {
          node.legendChild = this;
          if (node.formElement && node.formElement.legend) {
            node.legend = util.applyArrayPath(node.formElement.legend, node.arrayPath);
            formData.idx = (node.arrayPath.length > 0) ?
              node.arrayPath[node.arrayPath.length-1] + 1 :
              node.childPos + 1;
            formData.value = util.isSet(this.value) ? this.value : '';
            node.legend = langx.template(node.legend, util.valueTemplateSettings)(formData);
            break;
          }
        }
        node = node.parentNode;
      }
    }
  };


  /**
   * Returns the number of items that the array node should have based on
   * previously submitted values.
   *
   * The whole difficulty is that values may be hidden deep in the subtree
   * of the node and may actually target different arrays in the JSON schema.
   *
   * @function
   * @param {Object} values Previously submitted values
   * @param {Array(Number)} arrayPath the array path we're interested in
   * @return {Number} The number of items in the array
   */
  formNode.prototype.getPreviousNumberOfItems = function (values, arrayPath) {
    var key = null;
    var arrayValue = null;
    var childNumbers = null;
    var idx = 0;

    if (!values) {
      // No previously submitted values, no need to go any further
      return 0;
    }

    if (this.view.inputfield && this.schemaElement) {
      // Case 1: node is a simple input field that links to a key in the schema.
      // The schema key looks typically like:
      //  foo.bar[].baz.toto[].truc[].bidule
      // The goal is to apply the array path and truncate the key to the last
      // array we're interested in, e.g. with an arrayPath [4, 2]:
      //  foo.bar[4].baz.toto[2]
      key = truncateToArrayDepth(this.formElement.key, arrayPath.length);
      key = util.applyArrayPath(key, arrayPath);
      arrayValue = jsonform.util.getObjKey(values, key);
      if (!arrayValue) {
        // No key? That means this field had been left empty
        // in previous submit
        return 0;
      }
      childNumbers = arrays.map(this.children,function (child) {
        return child.getPreviousNumberOfItems(values, arrayPath);
      });
      return util.max([util.max(childNumbers) || 0, arrayValue.length]);
    }
    else if (this.view.array) {
      // Case 2: node is an array-like node, look for input fields
      // in its child template
      return this.childTemplate.getPreviousNumberOfItems(values, arrayPath);
    }
    else {
      // Case 3: node is a leaf or a container,
      // recurse through the list of children and return the maximum
      // number of items found in each subtree
      childNumbers = arrays.map(this.children,function (child) { 
        return child.getPreviousNumberOfItems(values, arrayPath);
      });
      return util.max(childNumbers) || 0;
    }
  };


  /**
   * Returns the structured object that corresponds to the form values entered
   * by the user for the node's subtree.
   *
   * The returned object follows the structure of the JSON schema that gave
   * birth to the form.
   *
   * Obviously, the node must have been rendered before that function may
   * be called.
   *
   * @function
   * @param {Array(Number)} updateArrayPath Array path to use to pretend that
   *  the entered values were actually entered for another item in an array
   *  (this is used to move values around when an item is inserted/removed/moved
   *  in an array)
   * @return {Object} The object that follows the data schema and matches the
   *  values entered by the user.
   */
  formNode.prototype.getFormValues = function (updateArrayPath) {
    // The values object that will be returned
    var values = {};

    if (!this.el) {
      throw new Error('formNode.getFormValues can only be called on nodes that are associated with a DOM element in the tree');
    }

    // Form fields values
    var formArray = $(':input', this.el).serializeArray();

    // Set values to false for unset checkboxes and radio buttons
    // because serializeArray() ignores them
    formArray = formArray.concat(
      $(':input[type=checkbox]:not(:disabled):not(:checked)', this.el).map( function() {
        return {"name": this.name, "value": this.checked}
      }).get()
    );

    if (updateArrayPath) {
      util.each(formArray, function (param) {
        param.name = util.applyArrayPath(param.name, updateArrayPath);
      });
    }

    // The underlying data schema
    var formSchema = this.ownerTree.formDesc.schema;

    for (var i = 0; i < formArray.length; i++) {
      // Retrieve the key definition from the data schema
      var name = formArray[i].name;
      var eltSchema = util.getSchemaKey(formSchema.properties, name);
      var arrayMatch = null;
      var cval = null;

      // Skip the input field if it's not part of the schema
      if (!eltSchema) continue;

      // Handle multiple checkboxes separately as the idea is to generate
      // an array that contains the list of enumeration items that the user
      // selected.
      if (eltSchema._jsonform_checkboxes_as_array) {
        arrayMatch = name.match(/\[([0-9]*)\]$/);
        if (arrayMatch) {
          name = name.replace(/\[([0-9]*)\]$/, '');
          cval = jsonform.util.getObjKey(values, name) || [];
          if (formArray[i].value === '1') {
            // Value selected, push the corresponding enumeration item
            // to the data result
            cval.push(eltSchema['enum'][parseInt(arrayMatch[1],10)]);
          }
          jsonform.util.setObjKey(values, name, cval);
          continue;
        }
      }

      // Type casting
      if (eltSchema.type === 'boolean') {
        if (formArray[i].value === '0') {
          formArray[i].value = false;
        } else {
          formArray[i].value = !!formArray[i].value;
        }
      }
      if ((eltSchema.type === 'number') ||
        (eltSchema.type === 'integer')) {
        if (types.isString(formArray[i].value)) {
          if (!formArray[i].value.length) {
            formArray[i].value = null;
          } else if (!isNaN(Number(formArray[i].value))) {
            formArray[i].value = Number(formArray[i].value);
          }
        }
      }
      if ((eltSchema.type === 'string') &&
        (formArray[i].value === '') &&
        !eltSchema._jsonform_allowEmpty) {
        formArray[i].value=null;
      }
      if ((eltSchema.type === 'object') &&
        types.isString(formArray[i].value) &&
        (formArray[i].value.substring(0,1) === '{')) {
        try {
          formArray[i].value = JSON.parse(formArray[i].value);
        } catch (e) {
          formArray[i].value = {};
        }
      }
      //TODO: is this due to a serialization bug?
      if ((eltSchema.type === 'object') &&
        (formArray[i].value === 'null' || formArray[i].value === '')) {
        formArray[i].value = null;
      }

      if (formArray[i].name && (formArray[i].value !== null)) {
        jsonform.util.setObjKey(values, formArray[i].name, formArray[i].value);
      }
    }
    return values;
  };



  /**
   * Renders the node.
   *
   * Rendering is done in three steps: HTML generation, DOM element creation
   * and insertion, and an enhance step to bind event handlers.
   *
   * @function
   * @param {Node} el The DOM element where the node is to be rendered. The
   *  node is inserted at the right position based on its "childPos" property.
   */
  formNode.prototype.render = function (el) {
    var html = this.generate();
    this.setContent(html, el);
    this.enhance();
  };


  /**
   * Inserts/Updates the HTML content of the node in the DOM.
   *
   * If the HTML is an update, the new HTML content replaces the old one.
   * The new HTML content is not moved around in the DOM in particular.
   *
   * The HTML is inserted at the right position in its parent's DOM subtree
   * otherwise (well, provided there are enough children, but that should always
   * be the case).
   *
   * @function
   * @param {string} html The HTML content to render
   * @param {Node} parentEl The DOM element that is to contain the DOM node.
   *  This parameter is optional (the node's parent is used otherwise) and
   *  is ignored if the node to render is already in the DOM tree.
   */
  formNode.prototype.setContent = function (html, parentEl) {
    var node = $(html);
    var parentNode = parentEl ||
      (this.parentNode ? this.parentNode.el : this.ownerTree.domRoot);
    var nextSibling = null;

    if (this.el) {
      // Replace the contents of the DOM element if the node is already in the tree
      $(this.el).replaceWith(node);
    }
    else {
      // Insert the node in the DOM if it's not already there
      nextSibling = $(parentNode).children().get(this.childPos);
      if (nextSibling) {
        $(nextSibling).before(node);
      }
      else {
        $(parentNode).append(node);
      }
    }

    // Save the link between the form node and the generated HTML
    this.el = node;

    // Update the node's subtree, extracting DOM elements that match the nodes
    // from the generated HTML
    this.updateElement(this.el);
  };


  /**
   * Updates the DOM element associated with the node.
   *
   * Only nodes that have ID are directly associated with a DOM element.
   *
   * @function
   */
  formNode.prototype.updateElement = function (domNode) {
    if (this.id) {
      this.el = $('#' + util.escapeSelector(this.id), domNode).get(0);
      if (this.view && this.view.getElement) {
        this.el = this.view.getElement(this.el);
      }
      if ((this.fieldtemplate !== false) &&
        this.view && this.view.fieldtemplate) {
        // The field template wraps the element two or three level deep
        // in the DOM tree, depending on whether there is anything prepended
        // or appended to the input field
        this.el = $(this.el).parent().parent();
        if (this.prepend || this.prepend) {
          this.el = this.el.parent();
        }
        this.el = this.el.get(0);
      }
      if (this.parentNode && this.parentNode.view &&
        this.parentNode.view.childTemplate) {
        // TODO: the child template may introduce more than one level,
        // so the number of levels introduced should rather be exposed
        // somehow in jsonform.fieldtemplate.
        this.el = $(this.el).parent().get(0);
      }
    }

    for (const k in  this.children) {
       if (this.children.hasOwnProperty(k) == false) {
           continue;
       }
       this.children[k].updateElement(this.el || domNode);
   }
  };


  /**
   * Generates the view's HTML content for the underlying model.
   *
   * @function
   */
  formNode.prototype.generate = function () {
    var data = {
      id: this.id,
      keydash: this.keydash,
      elt: this.formElement,
      schema: this.schemaElement,
      node: this,
      value: util.isSet(this.value) ? this.value : '',
      escape: strings.escapeHTML
    };
    var template = null;
    var html = '';

    // Complete the data context if needed
    if (this.ownerTree.formDesc.onBeforeRender) {
      this.ownerTree.formDesc.onBeforeRender(data, this);
    }
    if (this.view.onBeforeRender) {
      this.view.onBeforeRender(data, this);
    }

    // Use the template that 'onBeforeRender' may have set,
    // falling back to that of the form element otherwise
    if (this.template) {
      template = this.template;
    }
    else if (this.formElement && this.formElement.template) {
      template = this.formElement.template;
    }
    else {
      template = this.view.template;
    }

    // Wrap the view template in the generic field template
    // (note the strict equality to 'false', needed as we fallback
    // to the view's setting otherwise)
    if ((this.fieldtemplate !== false) &&
      (this.fieldtemplate || this.view.fieldtemplate)) {
      template = jsonform.fieldTemplate(template);
    }

    // Wrap the content in the child template of its parent if necessary.
    if (this.parentNode && this.parentNode.view &&
      this.parentNode.view.childTemplate) {
      // only allow drag of children if default or enabled
      template = this.parentNode.view.childTemplate(template, (!util.isSet(this.parentNode.formElement.draggable) ? true : this.parentNode.formElement.draggable));
    }

    // Prepare the HTML of the children
    var childrenhtml = '';
    util.each(this.children, function (child) {
      childrenhtml += child.generate();
    });
    data.children = childrenhtml;

    data.fieldHtmlClass = '';
    if (this.ownerTree &&
        this.ownerTree.formDesc &&
        this.ownerTree.formDesc.params &&
        this.ownerTree.formDesc.params.fieldHtmlClass) {
      data.fieldHtmlClass = this.ownerTree.formDesc.params.fieldHtmlClass;
    }
    if (this.formElement &&
        (typeof this.formElement.fieldHtmlClass !== 'undefined')) {
      data.fieldHtmlClass = this.formElement.fieldHtmlClass;
    }

    // Apply the HTML template
    html = langx.template(template, util.fieldTemplateSettings)(data);
    return html;
  };


  /**
   * Enhances the view with additional logic, binding event handlers
   * in particular.
   *
   * The function also runs the "insert" event handler of the view and
   * form element if they exist (starting with that of the view)
   *
   * @function
   */
  formNode.prototype.enhance = function () {
    var node = this;
    var handlers = null;
    var handler = null;
    var formData = objects.clone(this.ownerTree.formDesc.tpldata) || {};

    if (this.formElement) {
      // Check the view associated with the node as it may define an "onInsert"
      // event handler to be run right away
      if (this.view.onInsert) {
        this.view.onInsert({ target: $(this.el) }, this);
      }

      handlers = this.handlers || this.formElement.handlers;

      // Trigger the "insert" event handler
      handler = this.onInsert || this.formElement.onInsert;
      if (handler) {
        handler({ target: $(this.el) }, this);
      }
      if (handlers) {
        util.each(handlers, function (handler, onevent) {
          if (onevent === 'insert') {
            handler({ target: $(this.el) }, this);
          }
        }, this);
      }

      // No way to register event handlers if the DOM element is unknown
      // TODO: find some way to register event handlers even when this.el is not set.
      if (this.el) {

        // Register specific event handlers
        // TODO: Add support for other event handlers
        if (this.onChange)
          $(this.el).bind('change', function(evt) { node.onChange(evt, node); });
        if (this.view.onChange)
          $(this.el).bind('change', function(evt) { node.view.onChange(evt, node); });
        if (this.formElement.onChange)
          $(this.el).bind('change', function(evt) { node.formElement.onChange(evt, node); });

        if (this.onInput)
          $(this.el).bind('input', function(evt) { node.onInput(evt, node); });
        if (this.view.onInput)
          $(this.el).bind('input', function(evt) { node.view.onInput(evt, node); });
        if (this.formElement.onInput)
          $(this.el).bind('input', function(evt) { node.formElement.onInput(evt, node); });

        if (this.onClick)
          $(this.el).bind('click', function(evt) { node.onClick(evt, node); });
        if (this.view.onClick)
          $(this.el).bind('click', function(evt) { node.view.onClick(evt, node); });
        if (this.formElement.onClick)
          $(this.el).bind('click', function(evt) { node.formElement.onClick(evt, node); });

        if (this.onKeyUp)
          $(this.el).bind('keyup', function(evt) { node.onKeyUp(evt, node); });
        if (this.view.onKeyUp)
          $(this.el).bind('keyup', function(evt) { node.view.onKeyUp(evt, node); });
        if (this.formElement.onKeyUp)
          $(this.el).bind('keyup', function(evt) { node.formElement.onKeyUp(evt, node); });

        if (handlers) {
          util.each(handlers, function (handler, onevent) {
            if (onevent !== 'insert') {
              $(this.el).bind(onevent, function(evt) { handler(evt, node); });
            }
          }, this);
        }
      }

      // Auto-update legend based on the input field that's associated with it
      if (this.legendChild && this.legendChild.formElement) {
        var onChangeHandler = function (evt) {
          if (node.formElement && node.formElement.legend && node.parentNode) {
            node.legend = util.applyArrayPath(node.formElement.legend, node.arrayPath);
            formData.idx = (node.arrayPath.length > 0) ?
                node.arrayPath[node.arrayPath.length - 1] + 1 :
                node.childPos + 1;
            formData.value = $(evt.target).val();
            node.legend = langx.template(node.legend, util.valueTemplateSettings)(formData);
            $(node.parentNode.el).trigger('legendUpdated');
          }
        };
        $(this.legendChild.el).bind('change', onChangeHandler);
        $(this.legendChild.el).bind('keyup', onChangeHandler);
      }
    }

    // Recurse down the tree to enhance children
    util.each(this.children, function (child) {
      child.enhance();
    });
  };



  /**
   * Inserts an item in the array at the requested position and renders the item.
   *
   * @function
   * @param {Number} idx Insertion index
   */
  formNode.prototype.insertArrayItem = function (idx, domElement) {
    var i = 0;

    // Insert element at the end of the array if index is not given
    if (idx === undefined) {
      idx = this.children.length;
    }

    // Create the additional array item at the end of the list,
    // using the item template created when tree was initialized
    // (the call to resetValues ensures that 'arrayPath' is correctly set)
    var child = this.childTemplate.clone();
    this.appendChild(child);
    child.resetValues();

    // To create a blank array item at the requested position,
    // shift values down starting at the requested position
    // one to insert (note we start with the end of the array on purpose)
    for (i = this.children.length-2; i >= idx; i--) {
      this.children[i].moveValuesTo(this.children[i+1]);
    }

    // Initialize the blank node we've created with default values
    this.children[idx].resetValues();
    this.children[idx].computeInitialValues();

    // Re-render all children that have changed
    for (i = idx; i < this.children.length; i++) {
      this.children[i].render(domElement);
    }
  };


  /**
   * Remove an item from an array
   *
   * @function
   * @param {Number} idx The index number of the item to remove
   */
  formNode.prototype.deleteArrayItem = function (idx) {
    var i = 0;
    var child = null;

    // Delete last item if no index is given
    if (idx === undefined) {
      idx = this.children.length - 1;
    }

    // Move values up in the array
    for (i = idx; i < this.children.length-1; i++) {
      this.children[i+1].moveValuesTo(this.children[i]);
      this.children[i].render();
    }

    // Remove the last array item from the DOM tree and from the form tree
    this.removeChild();
  };

  /**
   * Returns the minimum/maximum number of items that an array field
   * is allowed to have according to the schema definition of the fields
   * it contains.
   *
   * The function parses the schema definitions of the array items that
   * compose the current "array" node and returns the minimum value of
   * "maxItems" it encounters as the maximum number of items, and the
   * maximum value of "minItems" as the minimum number of items.
   *
   * The function reports a -1 for either of the boundaries if the schema
   * does not put any constraint on the number of elements the current
   * array may have of if the current node is not an array.
   *
   * Note that array boundaries should be defined in the JSON Schema using
   * "minItems" and "maxItems". The code also supports "minLength" and
   * "maxLength" as a fallback, mostly because it used to by mistake (see #22)
   * and because other people could make the same mistake.
   *
   * @function
   * @return {Object} An object with properties "minItems" and "maxItems"
   *  that reports the corresponding number of items that the array may
   *  have (value is -1 when there is no constraint for that boundary)
   */
  formNode.prototype.getArrayBoundaries = function () {
    var boundaries = {
      minItems: -1,
      maxItems: -1
    };
    if (!this.view || !this.view.array) return boundaries;

    var getNodeBoundaries = function (node, initialNode) {
      var schemaKey = null;
      var arrayKey = null;
      var boundaries = {
        minItems: -1,
        maxItems: -1
      };
      initialNode = initialNode || node;

      if (node.view && node.view.array && (node !== initialNode)) {
        // New array level not linked to an array in the schema,
        // so no size constraints
        return boundaries;
      }

      if (node.key) {
        // Note the conversion to target the actual array definition in the
        // schema where minItems/maxItems may be defined. If we're still looking
        // at the initial node, the goal is to convert from:
        //  foo[0].bar[3].baz to foo[].bar[].baz
        // If we're not looking at the initial node, the goal is to look at the
        // closest array parent:
        //  foo[0].bar[3].baz to foo[].bar
        arrayKey = node.key.replace(/\[[0-9]+\]/g, '[]');
        if (node !== initialNode) {
          arrayKey = arrayKey.replace(/\[\][^\[\]]*$/, '');
        }
        schemaKey = util.getSchemaKey(
          node.ownerTree.formDesc.schema.properties,
          arrayKey
        );
        if (!schemaKey) return boundaries;
        return {
          minItems: schemaKey.minItems || schemaKey.minLength || -1,
          maxItems: schemaKey.maxItems || schemaKey.maxLength || -1
        };
      }
      else {
        util.each(node.children, function (child) {
          var subBoundaries = getNodeBoundaries(child, initialNode);
          if (subBoundaries.minItems !== -1) {
            if (boundaries.minItems !== -1) {
              boundaries.minItems = Math.max(
                boundaries.minItems,
                subBoundaries.minItems
              );
            }
            else {
              boundaries.minItems = subBoundaries.minItems;
            }
          }
          if (subBoundaries.maxItems !== -1) {
            if (boundaries.maxItems !== -1) {
              boundaries.maxItems = Math.min(
                boundaries.maxItems,
                subBoundaries.maxItems
              );
            }
            else {
              boundaries.maxItems = subBoundaries.maxItems;
            }
          }
        });
      }
      return boundaries;
    };
    return getNodeBoundaries(this);
  };

  return jsonform.formNode = formNode;
});

