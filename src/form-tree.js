define([
  "skylark-langx-globals",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-strings",
  "skylark-jquery",
  "./jsonform",
  "./util",
  "./element-types",
  "./form-node"
],function(globals,types,objects,arrays,strings,$,jsonform,util,elementTypes,formNode){
  //3098-3649

  /**
   * Form tree class.
   *
   * Holds the internal representation of the form.
   * The tree is always in sync with the rendered form, this allows to parse
   * it easily.
   *
   * @class
   */
  var formTree = function () {
    this.eventhandlers = [];
    this.root = null;
    this.formDesc = null;
  };

  /**
   * Initializes the form tree structure from the JSONForm object
   *
   * This function is the main entry point of the JSONForm library.
   *
   * Initialization steps:
   * 1. the internal tree structure that matches the JSONForm object
   *  gets created (call to buildTree)
   * 2. initial values are computed from previously submitted values
   *  or from the default values defined in the JSON schema.
   *
   * When the function returns, the tree is ready to be rendered through
   * a call to "render".
   *
   * @function
   */
  formTree.prototype.initialize = function (formDesc) {
    formDesc = formDesc || {};

    // Keep a pointer to the initial JSONForm
    // (note clone returns a shallow copy, only first-level is cloned)
    this.formDesc = objects.clone(formDesc);

    this.formDesc.prefix = this.formDesc.prefix ||
      'jsonform-' + strings.uniqueId();

    // JSON schema shorthand
    if (this.formDesc.schema && !this.formDesc.schema.properties) {
      this.formDesc.schema = {
        properties: this.formDesc.schema
      };
    }

    // Ensure layout is set
    this.formDesc.form = this.formDesc.form || [
      '*',
      {
        type: 'actions',
        items: [
          {
            type: 'submit',
            value: 'Submit'
          }
        ]
      }
    ];
    this.formDesc.form = (types.isArray(this.formDesc.form) ?
      this.formDesc.form :
      [this.formDesc.form]);

    this.formDesc.params = this.formDesc.params || {};

    // Create the root of the tree
    this.root = new formNode();
    this.root.ownerTree = this;
    this.root.view = elementTypes['root'];

    // Generate the tree from the form description
    this.buildTree();

    // Compute the values associated with each node
    // (for arrays, the computation actually creates the form nodes)
    this.computeInitialValues();
  };


  /**
   * Constructs the tree from the form description.
   *
   * The function must be called once when the tree is first created.
   *
   * @function
   */
  formTree.prototype.buildTree = function () {
    // Parse and generate the form structure based on the elements encountered:
    // - '*' means "generate all possible fields using default layout"
    // - a key reference to target a specific data element
    // - a more complex object to generate specific form sections
    util.each(this.formDesc.form,  (formElement) => {
      if (formElement === '*') {
        util.each(this.formDesc.schema.properties,  (element, key) => {
          this.root.appendChild(this.buildFromLayout({
            key: key
          }));
        });
      }
      else {
        if (types.isString(formElement)) {
          formElement = {
            key: formElement
          };
        }
        this.root.appendChild(this.buildFromLayout(formElement));
      }
    }, this);
  };


  /**
   * Builds the internal form tree representation from the requested layout.
   *
   * The function is recursive, generating the node children as necessary.
   * The function extracts the values from the previously submitted values
   * (this.formDesc.value) or from default values defined in the schema.
   *
   * @function
   * @param {Object} formElement JSONForm element to render
   * @param {Object} context The parsing context (the array depth in particular)
   * @return {Object} The node that matches the element.
   */
  formTree.prototype.buildFromLayout = function (formElement, context) {
    var schemaElement = null;
    var node = new formNode();
    var view = null;
    var key = null;

    // The form element parameter directly comes from the initial
    // JSONForm object. We'll make a shallow copy of it and of its children
    // not to pollute the original object.
    // (note JSON.parse(JSON.stringify()) cannot be used since there may be
    // event handlers in there!)
    formElement = objects.clone(formElement);
    if (formElement.items) {
      if (types.isArray(formElement.items)) {
        formElement.items = arrays.map(formElement.items,objects.clone); 
      }
      else {
        formElement.items = [ objects.clone(formElement.items) ];
      }
    }

    if (formElement.key) {
      // The form element is directly linked to an element in the JSON
      // schema. The properties of the form element override those of the
      // element in the JSON schema. Properties from the JSON schema complete
      // those of the form element otherwise.

      // Retrieve the element from the JSON schema
      schemaElement = util.getSchemaKey(
        this.formDesc.schema.properties,
        formElement.key);
      if (!schemaElement) {
        // The JSON Form is invalid!
        throw new Error('The JSONForm object references the schema key "' +
          formElement.key + '" but that key does not exist in the JSON schema');
      }

      // Schema element has just been found, let's trigger the
      // "onElementSchema" event
      // (tidoust: not sure what the use case for this is, keeping the
      // code for backward compatibility)
      if (this.formDesc.onElementSchema) {
        this.formDesc.onElementSchema(formElement, schemaElement);
      }

      formElement.name =
        formElement.name ||
        formElement.key;
      formElement.title =
        formElement.title ||
        schemaElement.title;
      formElement.description =
        formElement.description ||
        schemaElement.description;
      formElement.readOnly =
        formElement.readOnly ||
        schemaElement.readOnly ||
        formElement.readonly ||
        schemaElement.readonly;

      // Compute the ID of the input field
      if (!formElement.id) {
        formElement.id = util.escapeSelector(this.formDesc.prefix) +
          '-elt-' + util.slugify(formElement.key);
      }

      // Should empty strings be included in the final value?
      // TODO: it's rather unclean to pass it through the schema.
      if (formElement.allowEmpty) {
        schemaElement._jsonform_allowEmpty = true;
      }

      // If the form element does not define its type, use the type of
      // the schema element.
      if (!formElement.type) {
        // If schema type is an array containing only a type and "null",
        // remove null and make the element non-required
        if (types.isArray(schemaElement.type)) {
          if (arrays.contains(schemaElement.type, "null")) {
            schemaElement.type = arrays.without(schemaElement.type, "null");
            schemaElement.required = false;
          }
          if (schemaElement.type.length > 1) {
            throw new Error("Cannot process schema element with multiple types.");
          }
          schemaElement.type = arrays.first(schemaElement.type);
        }

        if ((schemaElement.type === 'string') &&
          (schemaElement.format === 'color')) {
          formElement.type = 'color';
        } else if ((schemaElement.type === 'number' ||
          schemaElement.type === 'integer') &&
          !schemaElement['enum']) {
         formElement.type = 'number';
         if (schemaElement.type === 'number') schemaElement.step = 'any';
        } else if ((schemaElement.type === 'string' ||
          schemaElement.type === 'any') &&
          !schemaElement['enum']) {
          formElement.type = 'text';
        } else if (schemaElement.type === 'boolean') {
          formElement.type = 'checkbox';
        } else if (schemaElement.type === 'object') {
          if (schemaElement.properties) {
            formElement.type = 'fieldset';
          } else {
            formElement.type = 'textarea';
          }
        } else if (!types.isUndefined(schemaElement['enum'])) {
          formElement.type = 'select';
        } else {
          formElement.type = schemaElement.type;
        }
      }

      // Unless overridden in the definition of the form element (or unless
      // there's a titleMap defined), use the enumeration list defined in
      // the schema
      if (!formElement.options && schemaElement['enum']) {
        if (formElement.titleMap) {
          formElement.options = arrays.map(schemaElement['enum'], function (value) {
            return {
              value: value,
              title: util.hasOwnProperty(formElement.titleMap, value) ? formElement.titleMap[value] : value
            };
          });
        }
        else {
          formElement.options = schemaElement['enum'];
        }
      }

      // Flag a list of checkboxes with multiple choices
      if ((formElement.type === 'checkboxes') && schemaElement.items) {
        var itemsEnum = schemaElement.items['enum'];
        if (itemsEnum) {
          schemaElement.items._jsonform_checkboxes_as_array = true;
        }
        if (!itemsEnum && schemaElement.items[0]) {
          itemsEnum = schemaElement.items[0]['enum'];
          if (itemsEnum) {
            schemaElement.items[0]._jsonform_checkboxes_as_array = true;
          }
        }
      }

      // If the form element targets an "object" in the JSON schema,
      // we need to recurse through the list of children to create an
      // input field per child property of the object in the JSON schema
      if (schemaElement.type === 'object') {
        util.each(schemaElement.properties, (prop, propName) => {
          node.appendChild(this.buildFromLayout({
            key: formElement.key + '.' + propName
          }));
        });
      }
    }

    if (!formElement.type) {
      formElement.type = 'none';
    }
    view = elementTypes[formElement.type];
    if (!view) {
      throw new Error('The JSONForm contains an element whose type is unknown: "' +
        formElement.type + '"');
    }


    if (schemaElement) {
      // The form element is linked to an element in the schema.
      // Let's make sure the types are compatible.
      // In particular, the element must not be a "container"
      // (or must be an "object" or "array" container)
      if (!view.inputfield && !view.array &&
        (formElement.type !== 'selectfieldset') &&
        (schemaElement.type !== 'object')) {
        throw new Error('The JSONForm contains an element that links to an ' +
          'element in the JSON schema (key: "' + formElement.key + '") ' +
          'and that should not based on its type ("' + formElement.type + '")');
      }
    }
    else {
      // The form element is not linked to an element in the schema.
      // This means the form element must be a "container" element,
      // and must not define an input field.
      if (view.inputfield && (formElement.type !== 'selectfieldset')) {
        throw new Error('The JSONForm defines an element of type ' +
          '"' + formElement.type + '" ' +
          'but no "key" property to link the input field to the JSON schema');
      }
    }

    // A few characters need to be escaped to use the ID as jQuery selector
    formElement.iddot = util.escapeSelector(formElement.id || '');

    // Initialize the form node from the form element and schema element
    node.formElement = formElement;
    node.schemaElement = schemaElement;
    node.view = view;
    node.ownerTree = this;

    // Set event handlers
    if (!formElement.handlers) {
      formElement.handlers = {};
    }

    // Parse children recursively
    if (node.view.array) {
      // The form element is an array. The number of items in an array
      // is by definition dynamic, up to the form user (through "Add more",
      // "Delete" commands). The positions of the items in the array may
      // also change over time (through "Move up", "Move down" commands).
      //
      // The form node stores a "template" node that serves as basis for
      // the creation of an item in the array.
      //
      // Array items may be complex forms themselves, allowing for nesting.
      //
      // The initial values set the initial number of items in the array.
      // Note a form element contains at least one item when it is rendered.
      if (formElement.items) {
        key = formElement.items[0] || formElement.items;
      }
      else {
        key = formElement.key + '[]';
      }
      if (types.isString(key)) {
        key = { key: key };
      }
      node.setChildTemplate(this.buildFromLayout(key));
    }
    else if (formElement.items) {
      // The form element defines children elements
      util.each(formElement.items, (item)=>{
        if (types.isString(item)) {
          item = { key: item };
        }
        node.appendChild(this.buildFromLayout(item));
      });
    }

    return node;
  };


  /**
   * Computes the values associated with each input field in the tree based
   * on previously submitted values or default values in the JSON schema.
   *
   * For arrays, the function actually creates and inserts additional
   * nodes in the tree based on previously submitted values (also ensuring
   * that the array has at least one item).
   *
   * The function sets the array path on all nodes.
   * It should be called once in the lifetime of a form tree right after
   * the tree structure has been created.
   *
   * @function
   */
  formTree.prototype.computeInitialValues = function () {
    this.root.computeInitialValues(this.formDesc.value);
  };


  /**
   * Renders the form tree
   *
   * @function
   * @param {Node} domRoot The "form" element in the DOM tree that serves as
   *  root for the form
   */
  formTree.prototype.render = function (domRoot) {
    if (!domRoot) return;
    this.domRoot = domRoot;
    this.root.render();

    // If the schema defines required fields, flag the form with the
    // "jsonform-hasrequired" class for styling purpose
    // (typically so that users may display a legend)
    if (this.hasRequiredField()) {
      $(domRoot).addClass('jsonform-hasrequired');
    }
  };

  /**
   * Walks down the element tree with a callback
   *
   * @function
   * @param {Function} callback The callback to call on each element
   */
  formTree.prototype.forEachElement = function (callback) {

    var f = function(root) {
      for (var i=0;i<root.children.length;i++) {
        callback(root.children[i]);
        f(root.children[i]);
      }
    };
    f(this.root);

  };

  formTree.prototype.validate = function(noErrorDisplay) {

    var values = jsonform.getFormValue(this.domRoot);
    var errors = false;

    var options = this.formDesc;

    if (options.validate!==false) {
      var validator = false;
      if (typeof options.validate!="object") {
        if (globals.JSONFormValidator) {
          validator = globals.JSONFormValidator.createEnvironment("json-schema-draft-03");
        }
      } else {
        validator = options.validate;
      }
      if (validator) {
        var v = validator.validate(values, this.formDesc.schema);
        $(this.domRoot).jsonFormErrors(false,options);
        if (v.errors.length) {
          if (!errors) errors = [];
          errors = errors.concat(v.errors);
        }
      }
    }

    if (errors && !noErrorDisplay) {
      if (options.displayErrors) {
        options.displayErrors(errors,this.domRoot);
      } else {
        $(this.domRoot).jsonFormErrors(errors,options);
      }
    }

    return {"errors":errors}

  }

  formTree.prototype.submit = function(evt) {

    var stopEvent = function() {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      return false;
    };
    var values = jsonform.getFormValue(this.domRoot);
    var options = this.formDesc;

    var brk=false;
    this.forEachElement(function(elt) {
      if (brk) return;
      if (elt.view.onSubmit) {
        brk = !elt.view.onSubmit(evt, elt); //may be called multiple times!!
      }
    });

    if (brk) return stopEvent();

    var validated = this.validate();

    if (options.onSubmit && !options.onSubmit(validated.errors,values)) {
      return stopEvent();
    }

    if (validated.errors) return stopEvent();

    if (options.onSubmitValid && !options.onSubmitValid(values)) {
      return stopEvent();
    }

    return false;

  };


  /**
   * Returns true if the form displays a "required" field.
   *
   * To keep things simple, the function parses the form's schema and returns
   * true as soon as it finds a "required" flag even though, in theory, that
   * schema key may not appear in the final form.
   *
   * Note that a "required" constraint on a boolean type is always enforced,
   * the code skips such definitions.
   *
   * @function
   * @return {boolean} True when the form has some required field,
   *  false otherwise.
   */
  formTree.prototype.hasRequiredField = function () {
    var parseElement = function (element) {
      if (!element) return null;
      if (element.required && (element.type !== 'boolean')) {
        return element;
      }

      var prop = arrays.find(element.properties, function (property) {
        return parseElement(property);
      });
      if (prop) {
        return prop;
      }

      if (element.items) {
        if (types.isArray(element.items)) {
          prop = arrays.find(element.items, function (item) {
            return parseElement(item);
          });
        }
        else {
          prop = parseElement(element.items);
        }
        if (prop) {
          return prop;
        }
      }
    };

    return parseElement(this.formDesc.schema);
  };


  return jsonform.formTree = formTree;

});
