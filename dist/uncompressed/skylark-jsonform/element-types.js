define([
  "skylark-langx",
  "skylark-jquery",
  "./jsonform",
  "./util"
],function(langx,$,jsonform,util){
  //245-1516
  var fileDisplayTemplate = '<div class="_jsonform-preview">' +
    '<% if (value.type=="image") { %>' +
    '<img class="jsonform-preview" id="jsonformpreview-<%= id %>" src="<%= value.url %>" />' +
    '<% } else { %>' +
    '<a href="<%= value.url %>"><%= value.name %></a> (<%= Math.ceil(value.size/1024) %>kB)' +
    '<% } %>' +
    '</div>' +
    '<a href="#" class="btn btn-default _jsonform-delete"><i class="glyphicon glyphicon-remove" title="Remove"></i></a> ';

  var inputFieldTemplate = function (type) {
    return {
      'template': '<input type="' + type + '" ' +
        'class=\'form-control<%= (fieldHtmlClass ? " " + fieldHtmlClass : "") %>\'' +
        'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
        ' aria-label="<%= node.title ? escape(node.title) : node.name %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
        '<%= (node.schemaElement && (node.schemaElement.step > 0 || node.schemaElement.step == "any") ? " step=\'" + node.schemaElement.step + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.minLength ? " minlength=\'" + node.schemaElement.minLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
        ' />',
      'fieldtemplate': true,
      'inputfield': true
    }
  };

  jsonform.elementTypes = {
    'none': {
      'template': ''
    },
    'root': {
      'template': '<div><%= children %></div>'
    },
    'text': inputFieldTemplate('text'),
    'password': inputFieldTemplate('password'),
    'date': inputFieldTemplate('date'),
    'datetime': inputFieldTemplate('datetime'),
    'datetime-local': inputFieldTemplate('datetime-local'),
    'email': inputFieldTemplate('email'),
    'month': inputFieldTemplate('month'),
    'number': inputFieldTemplate('number'),
    'search': inputFieldTemplate('search'),
    'tel': inputFieldTemplate('tel'),
    'time': inputFieldTemplate('time'),
    'url': inputFieldTemplate('url'),
    'week': inputFieldTemplate('week'),
    'range': {
      'template': '<div class="range"><input type="range" ' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
        ' aria-label="<%= node.title ? escape(node.title) : node.name %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        ' min=<%= range.min %>' +
        ' max=<%= range.max %>' +
        ' step=<%= range.step %>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        ' /><% if (range.indicator) { %><span class="range-value" rel="<%= id %>"><%= escape(value) %></span><% } %></div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onInput': function(evt, elt) {
        const valueIndicator = document.querySelector('span.range-value[rel="' + elt.id + '"]');
        if (valueIndicator) {
          valueIndicator.innerText = evt.target.value;
        }
      },
      'onBeforeRender': function (data, node) {
        data.range = {
          min: 1,
          max: 100,
          step: 1,
          indicator: false
        };
        if (!node || !node.schemaElement) return;
        if (node.formElement && node.formElement.step) {
          data.range.step = node.formElement.step;
        }
        if (node.formElement && node.formElement.indicator) {
          data.range.indicator = node.formElement.indicator;
        }
        if (typeof node.schemaElement.minimum !== 'undefined') {
          if (node.schemaElement.exclusiveMinimum) {
            data.range.min = node.schemaElement.minimum + data.range.step;
          }
          else {
            data.range.min = node.schemaElement.minimum;
          }
        }
        if (typeof node.schemaElement.maximum !== 'undefined') {
          if (node.schemaElement.exclusiveMaximum) {
            data.range.max = node.schemaElement.maximum - data.range.step;
          }
          else {
            data.range.max = node.schemaElement.maximum;
          }
        }
      }
    },
    'color':{
      'template':'<input type="text" ' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
        ' aria-label="<%= node.title ? escape(node.title) : node.name %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        ' />',
      'fieldtemplate': true,
      'inputfield': true,
      'onInsert': function(evt, node) {
        $(node.el).find('#' + util.escapeSelector(node.id)).spectrum({
          preferredFormat: "hex",
          showInput: true
        });
      }
    },
    'textarea':{
      'template':'<textarea id="<%= id %>" name="<%= node.name %>" ' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        'style="height:<%= elt.height || "150px" %>;width:<%= elt.width || "100%" %>;"' +
        ' aria-label="<%= node.title ? escape(node.title) : node.name %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.minLength ? " minlength=\'" + node.schemaElement.minLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
        '><%= value %></textarea>',
      'fieldtemplate': true,
      'inputfield': true
    },
    'wysihtml5':{
      'template':'<textarea id="<%= id %>" name="<%= node.name %>" style="height:<%= elt.height || "300px" %>;width:<%= elt.width || "100%" %>;"' +
        ' aria-label="<%= node.title ? escape(node.title) : node.name %>"' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.minLength ? " minlength=\'" + node.schemaElement.minLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
        '><%= value %></textarea>',
      'fieldtemplate': true,
      'inputfield': true,
      'onInsert': function (evt, node) {
        var setup = function () {
          //protect from double init
          if ($(node.el).data("wysihtml5")) return;
          $(node.el).data("wysihtml5_loaded",true);

          $(node.el).find('#' + util.escapeSelector(node.id)).wysihtml5({
            "html": true,
            "link": true,
            "font-styles":true,
            "image": false,
            "events": {
              "load": function () {
                // In chrome, if an element is required and hidden, it leads to
                // the error 'An invalid form control with name='' is not focusable'
                // See http://stackoverflow.com/questions/7168645/invalid-form-control-only-in-google-chrome
                $(this.textareaElement).removeAttr('required');
              }
            }
          });
        };

        // Is there a setup hook?
        if (window.jsonform_wysihtml5_setup) {
          window.jsonform_wysihtml5_setup(setup);
          return;
        }

        // Wait until wysihtml5 is loaded
        var itv = window.setInterval(function() {
          if (window.wysihtml5) {
            window.clearInterval(itv);
            setup();
          }
        },1000);
      }
    },
    'ace':{
      'template':'<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;"><div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div><input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/></div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onInsert': function (evt, node) {
        var setup = function () {
          var formElement = node.formElement || {};
          var ace = window.ace;
          var editor = ace.edit($(node.el).find('#' + util.escapeSelector(node.id) + '__ace').get(0));
          var idSelector = '#' + util.escapeSelector(node.id) + '__hidden';
          // Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
          // (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
          editor.getSession().setNewLineMode('unix');
          editor.renderer.setShowPrintMargin(false);
          editor.setTheme("ace/theme/"+(formElement.aceTheme||"twilight"));

          if (formElement.aceMode) {
            editor.getSession().setMode("ace/mode/"+formElement.aceMode);
          }
          editor.getSession().setTabSize(2);

          // Set the contents of the initial manifest file
          editor.getSession().setValue(node.value||"");

          //TODO: this is clearly sub-optimal
          // 'Lazily' bind to the onchange 'ace' event to give
          // priority to user edits
          var lazyChanged = langx.debounce(function () {
            $(node.el).find(idSelector).val(editor.getSession().getValue());
            $(node.el).find(idSelector).change();
          }, 600);
          editor.getSession().on('change', lazyChanged);

          editor.on('blur', function() {
            $(node.el).find(idSelector).change();
            $(node.el).find(idSelector).trigger("blur");
          });
          editor.on('focus', function() {
            $(node.el).find(idSelector).trigger("focus");
          });
        };

        // Is there a setup hook?
        if (window.jsonform_ace_setup) {
          window.jsonform_ace_setup(setup);
          return;
        }

        // Wait until ACE is loaded
        var itv = window.setInterval(function() {
          if (window.ace) {
            window.clearInterval(itv);
            setup();
          }
        },1000);
      }
    },
    'checkbox':{
      'template': '<div class="checkbox"><label><input type="checkbox" id="<%= id %>" ' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'": "") %>' +
        'name="<%= node.name %>" value="1" <% if (value) {%>checked<% } %>' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
        ' /><%= node.inlinetitle || "" %>' +
        '</label></div>',
      'fieldtemplate': true,
      'inputfield': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      }
    },
    'file':{
      'template':'<input class="input-file" id="<%= id %>" name="<%= node.name %>" type="file" ' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '<%= (node.formElement && node.formElement.accept ? (" accept=\'" + node.formElement.accept + "\'") : "") %>' +
        '/>',
      'fieldtemplate': true,
      'inputfield': true
    },
    'file-hosted-public':{
      'template':'<span><% if (value && (value.type||value.url)) { %>'+fileDisplayTemplate+'<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="<%= transloaditname %>" /><input data-transloadit-name="_transloadit_<%= transloaditname %>" type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
      'fieldtemplate': true,
      'inputfield': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onBeforeRender': function (data, node) {

        if (!node.ownerTree._transloadit_generic_public_index) {
          node.ownerTree._transloadit_generic_public_index=1;
        } else {
          node.ownerTree._transloadit_generic_public_index++;
        }

        data.transloaditname = "_transloadit_jsonform_genericupload_public_"+node.ownerTree._transloadit_generic_public_index;

        if (!node.ownerTree._transloadit_generic_elts) node.ownerTree._transloadit_generic_elts = {};
        node.ownerTree._transloadit_generic_elts[data.transloaditname] = node;
      },
      'onChange': function(evt,elt) {
        // The "transloadit" function should be called only once to enable
        // the service when the form is submitted. Has it already been done?
        if (elt.ownerTree._transloadit_bound) {
          return false;
        }
        elt.ownerTree._transloadit_bound = true;

        // Call the "transloadit" function on the form element
        var formElt = $(elt.ownerTree.domRoot);
        formElt.transloadit({
          autoSubmit: false,
          wait: true,
          onSuccess: function (assembly) {
            // Image has been uploaded. Check the "results" property that
            // contains the list of files that Transloadit produced. There
            // should be one image per file input in the form at most.
            var results = langx.values(assembly.results);
            results = langx.flatten(results);
            util.each(results, function (result) {
              // Save the assembly result in the right hidden input field
              var id = elt.ownerTree._transloadit_generic_elts[result.field].id;
              var input = formElt.find('#' + util.escapeSelector(id));
              var nonEmptyKeys = langx.filter(langx.keys(result.meta), function (key) {
                return !!util.isSet(result.meta[key]);
              });
              result.meta = langx.pick(result.meta, nonEmptyKeys);
              input.val(JSON.stringify(result));
            });

            // Unbind transloadit from the form
            elt.ownerTree._transloadit_bound = false;
            formElt.unbind('submit.transloadit');

            // Submit the form on next tick
            langx.defer(function () {  //_.dalay
              elt.ownerTree.submit();
            }, 10);
          },
          onError: function (assembly) {
            // TODO: report the error to the user
            console.log('assembly error', assembly);
          }
        });
      },
      'onInsert': function (evt, node) {
        $(node.el).find('a._jsonform-delete').on('click', function (evt) {
          $(node.el).find('._jsonform-preview').remove();
          $(node.el).find('a._jsonform-delete').remove();
          $(node.el).find('#' + util.escapeSelector(node.id)).val('');
          evt.preventDefault();
          return false;
        });
      },
      'onSubmit':function(evt, elt) {
        if (elt.ownerTree._transloadit_bound) {
          return false;
        }
        return true;
      }

    },
    'file-transloadit': {
      'template': '<span><% if (value && (value.type||value.url)) { %>'+fileDisplayTemplate+'<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="_transloadit_<%= node.name %>" /><input type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
      'fieldtemplate': true,
      'inputfield': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onChange': function (evt, elt) {
        // The "transloadit" function should be called only once to enable
        // the service when the form is submitted. Has it already been done?
        if (elt.ownerTree._transloadit_bound) {
          return false;
        }
        elt.ownerTree._transloadit_bound = true;

        // Call the "transloadit" function on the form element
        var formElt = $(elt.ownerTree.domRoot);
        formElt.transloadit({
          autoSubmit: false,
          wait: true,
          onSuccess: function (assembly) {
            // Image has been uploaded. Check the "results" property that
            // contains the list of files that Transloadit produced. Note
            // JSONForm only supports 1-to-1 associations, meaning it
            // expects the "results" property to contain only one image
            // per file input in the form.
            var results = langx.values(assembly.results);
            results = langx.flatten(results);
            util.each(results, function (result) {
              // Save the assembly result in the right hidden input field
              var input = formElt.find('input[name="' +
                result.field.replace(/^_transloadit_/, '') +
                '"]');
              var nonEmptyKeys = langx.filter(langx.keys(result.meta), function (key) {
                return !!util.isSet(result.meta[key]);
              });
              result.meta = langx.pick(result.meta, nonEmptyKeys);
              input.val(JSON.stringify(result));
            });

            // Unbind transloadit from the form
            elt.ownerTree._transloadit_bound = false;
            formElt.unbind('submit.transloadit');

            // Submit the form on next tick
            langx.defer(function () { //_.delay
              elt.ownerTree.submit();
            }, 10);
          },
          onError: function (assembly) {
            // TODO: report the error to the user
            console.log('assembly error', assembly);
          }
        });
      },
      'onInsert': function (evt, node) {
        $(node.el).find('a._jsonform-delete').on('click', function (evt) {
          $(node.el).find('._jsonform-preview').remove();
          $(node.el).find('a._jsonform-delete').remove();
          $(node.el).find('#' + util.escapeSelector(node.id)).val('');
          evt.preventDefault();
          return false;
        });
      },
      'onSubmit': function (evt, elt) {
        if (elt.ownerTree._transloadit_bound) {
          return false;
        }
        return true;
      }
    },
    'select':{
      'template':'<select name="<%= node.name %>" id="<%= id %>"' +
        'class=\'form-control<%= (fieldHtmlClass ? " " + fieldHtmlClass : "") %>\'' +
        '<%= (node.schemaElement && node.schemaElement.disabled? " disabled" : "")%>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '> ' +
        '<% _.forEach(node.options, function(key, val) { if(key instanceof Object) { if (value === key.value) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }} else { if (value === key) { %> <option selected value="<%= key %>"><%= key %></option> <% } else { %><option value="<%= key %>"><%= key %></option> <% }}}); %> ' +
        '</select>',
      'fieldtemplate': true,
      'inputfield': true
    },
    'imageselect': {
      'template': '<div>' +
        '<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
        '<div class="dropdown">' +
        '<a class="btn<% if (buttonClass && node.value) { %> <%= buttonClass %><% } else { %> btn-default<% } %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
          '<% if (node.value) { %><img src="<% if (!node.value.match(/^https?:/)) { %><%= prefix %><% } %><%= node.value %><%= suffix %>" alt="" /><% } else { %><%= buttonTitle %><% } %>' +
        '</a>' +
        '<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
          '<div>' +
          '<% _.forEach(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="btn<% if (buttonClass) { %> <%= buttonClass %><% } else { %> btn-default<% } %>" style="max-width:<%= width %>px;max-height:<%= height %>px"><% if (key instanceof Object) { %><img src="<% if (!key.value.match(/^https?:/)) { %><%= prefix %><% } %><%= key.value %><%= suffix %>" alt="<%= key.title %>" /></a><% } else { %><img src="<% if (!key.match(/^https?:/)) { %><%= prefix %><% } %><%= key %><%= suffix %>" alt="" /><% } %></a> <% }); %>' +
          '</div>' +
          '<div class="pagination-right"><a class="btn btn-default">Reset</a></div>' +
        '</div>' +
        '</div>' +
        '</div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onBeforeRender': function (data, node) {
        var elt = node.formElement || {};
        var nbRows = null;
        var maxColumns = elt.imageSelectorColumns || 5;
        data.buttonTitle = elt.imageSelectorTitle || 'Select...';
        data.prefix = elt.imagePrefix || '';
        data.suffix = elt.imageSuffix || '';
        data.width = elt.imageWidth || 32;
        data.height = elt.imageHeight || 32;
        data.buttonClass = elt.imageButtonClass || false;
        if (node.options.length > maxColumns) {
          nbRows = Math.ceil(node.options.length / maxColumns);
          data.columns = Math.ceil(node.options.length / nbRows);
        }
        else {
          data.columns = maxColumns;
        }
      },
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onInsert': function (evt, node) {
        $(node.el).on('click', '.dropdown-menu a', function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var img = (evt.target.nodeName.toLowerCase() === 'img') ?
            $(evt.target) :
            $(evt.target).find('img');
          var value = img.attr('src');
          var elt = node.formElement || {};
          var prefix = elt.imagePrefix || '';
          var suffix = elt.imageSuffix || '';
          var width = elt.imageWidth || 32;
          var height = elt.imageHeight || 32;
          if (value) {
            if (value.indexOf(prefix) === 0) {
              value = value.substring(prefix.length);
            }
            value = value.substring(0, value.length - suffix.length);
            $(node.el).find('input').attr('value', value);
            $(node.el).find('a[data-toggle="dropdown"]')
              .addClass(elt.imageButtonClass)
              .attr('style', 'max-width:' + width + 'px;max-height:' + height + 'px')
              .html('<img src="' + (!value.match(/^https?:/) ? prefix : '') + value + suffix + '" alt="" />');
          }
          else {
            $(node.el).find('input').attr('value', '');
            $(node.el).find('a[data-toggle="dropdown"]')
              .removeClass(elt.imageButtonClass)
              .removeAttr('style')
              .html(elt.imageSelectorTitle || 'Select...');
          }
        });
      }
    },
    'iconselect': {
      'template': '<div>' +
        '<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
        '<div class="dropdown">' +
        '<a class="btn<% if (buttonClass && node.value) { %> <%= buttonClass %><% } %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
          '<% if (node.value) { %><i class="icon-<%= node.value %>" /><% } else { %><%= buttonTitle %><% } %>' +
        '</a>' +
        '<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
          '<div>' +
          '<% _.forEach(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="btn<% if (buttonClass) { %> <%= buttonClass %><% } %>" ><% if (key instanceof Object) { %><i class="icon-<%= key.value %>" alt="<%= key.title %>" /></a><% } else { %><i class="icon-<%= key %>" alt="" /><% } %></a> <% }); %>' +
          '</div>' +
          '<div class="pagination-right"><a class="btn">Reset</a></div>' +
        '</div>' +
        '</div>' +
        '</div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onBeforeRender': function (data, node) {
        var elt = node.formElement || {};
        var nbRows = null;
        var maxColumns = elt.imageSelectorColumns || 5;
        data.buttonTitle = elt.imageSelectorTitle || 'Select...';
        data.buttonClass = elt.imageButtonClass || false;
        if (node.options.length > maxColumns) {
          nbRows = Math.ceil(node.options.length / maxColumns);
          data.columns = Math.ceil(node.options.length / nbRows);
        }
        else {
          data.columns = maxColumns;
        }
      },
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onInsert': function (evt, node) {
        $(node.el).on('click', '.dropdown-menu a', function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var i = (evt.target.nodeName.toLowerCase() === 'i') ?
            $(evt.target) :
            $(evt.target).find('i');
          var value = i.attr('class');
          var elt = node.formElement || {};
          if (value) {
            value = value;
            $(node.el).find('input').attr('value', value);
            $(node.el).find('a[data-toggle="dropdown"]')
              .addClass(elt.imageButtonClass)
              .html('<i class="'+ value +'" alt="" />');
          }
          else {
            $(node.el).find('input').attr('value', '');
            $(node.el).find('a[data-toggle="dropdown"]')
              .removeClass(elt.imageButtonClass)
              .html(elt.imageSelectorTitle || 'Select...');
          }
        });
      }
    },
    'radios':{
      'template': '<div id="<%= node.id %>"><% _.forEach(node.options, function(key, val) { %><div class="radio"><label><input<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'": "") %> type="radio" <% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '/><%= (key instanceof Object ? key.title : key) %></label></div> <% }); %></div>',
      'fieldtemplate': true,
      'inputfield': true
    },
    'radiobuttons': {
      'template': '<div id="<%= node.id %>">' +
        '<% _.forEach(node.options, function(key, val) { %>' +
          '<label class="btn btn-default <% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %>active btn-success<% } %>">' +
          '<input<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'": "") %> type="radio" style="position:absolute;left:-9999px;" ' +
          '<% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>" />' +
          '<span><%= (key instanceof Object ? key.title : key) %></span></label> ' +
          '<% }); %>' +
        '</div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onInsert': function (evt, node) {
        var activeClass = 'active';
        var elt = node.formElement || {};
        if (elt.activeClass) {
          activeClass += ' ' + elt.activeClass;
        }
        $(node.el).find('label').on('click', function () {
          $(this).parent().find('label').removeClass(activeClass);
          $(this).addClass(activeClass);
        });
      }
    },
    'checkboxes':{
      'template': '<div><%= choiceshtml %></div>',
      'fieldtemplate': true,
      'inputfield': true,
      'onBeforeRender': function (data, node) {
        // Build up choices from the enumeration list
        var choices = null;
        var choiceshtml = null;
        var template = '<div class="checkbox"><label>' +
          '<input type="checkbox" <% if (value) { %> checked="checked" <% } %> name="<%= name %>" value="1"' +
          '<%= (node.disabled? " disabled" : "")%>' +
          '/><%= title %></label></div>';
        if (!node || !node.schemaElement) return;

        if (node.schemaElement.items) {
          choices =
            node.schemaElement.items["enum"] ||
            node.schemaElement.items[0]["enum"];
        } else {
          choices = node.schemaElement["enum"];
        }
        if (!choices) return;

        choiceshtml = '';
        util.each(choices, function (choice, idx) {
          choiceshtml += langx.template(template, util.fieldTemplateSettings)({
            name: node.key + '[' + idx + ']',
            value: langx.contains(node.value, choice),
            title: util.hasOwnProperty(node.formElement.titleMap, choice) ? node.formElement.titleMap[choice] : choice,
            node: node
          });
        });

        data.choiceshtml = choiceshtml;
      }
    },
    'array': {
      'template': '<div id="<%= id %>"><ul class="_jsonform-array-ul" style="list-style-type:none;"><%= children %></ul>' +
        '<span class="_jsonform-array-buttons">' +
          '<a href="#" class="btn btn-default _jsonform-array-addmore"><i class="glyphicon glyphicon-plus-sign" title="Add new"></i></a> ' +
          '<a href="#" class="btn btn-default _jsonform-array-deletelast"><i class="glyphicon glyphicon-minus-sign" title="Delete last"></i></a>' +
        '</span>' +
        '</div>',
      'fieldtemplate': true,
      'array': true,
      'childTemplate': function (inner, enableDrag) {
        if ($('').sortable) {
          // Insert a "draggable" icon
          // floating to the left of the main element
          return '<li data-idx="<%= node.childPos %>">' +
            // only allow drag of children if enabled
            (enableDrag ? '<span class="draggable line"><i class="glyphicon glyphicon-list" title="Move item"></i></span>' : '') +
            inner +
            '</li>';
        }
        else {
          return '<li data-idx="<%= node.childPos %>">' +
            inner +
            '</li>';
        }
      },
      'onInsert': function (evt, node) {
        var $nodeid = $(node.el).find('#' + util.escapeSelector(node.id));
        var boundaries = node.getArrayBoundaries();

        // Switch two nodes in an array
        var moveNodeTo = function (fromIdx, toIdx) {
          // Note "switchValuesWith" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
          if (fromIdx === toIdx) return;
          var incr = (fromIdx < toIdx) ? 1: -1;
          var i = 0;
          var parentEl = $('> ul', $nodeid);
          for (i = fromIdx; i !== toIdx; i += incr) {
            node.children[i].switchValuesWith(node.children[i + incr]);
            node.children[i].render(parentEl.get(0));
            node.children[i + incr].render(parentEl.get(0));
          }

          // No simple way to prevent DOM reordering with jQuery UI Sortable,
          // so we're going to need to move sorted DOM elements back to their
          // origin position in the DOM ourselves (we switched values but not
          // DOM elements)
          var fromEl = $(node.children[fromIdx].el);
          var toEl = $(node.children[toIdx].el);
          fromEl.detach();
          toEl.detach();
          if (fromIdx < toIdx) {
            if (fromIdx === 0) parentEl.prepend(fromEl);
            else $(node.children[fromIdx-1].el).after(fromEl);
            $(node.children[toIdx-1].el).after(toEl);
          }
          else {
            if (toIdx === 0) parentEl.prepend(toEl);
            else $(node.children[toIdx-1].el).after(toEl);
            $(node.children[fromIdx-1].el).after(fromEl);
          }
        };

        $('> span > a._jsonform-array-addmore', $nodeid).click(function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var idx = node.children.length;
          if (boundaries.maxItems >= 0) {
            if (node.children.length > boundaries.maxItems - 2) {
              $nodeid.find('> span > a._jsonform-array-addmore')
                .addClass('disabled');
            }
            if (node.children.length > boundaries.maxItems - 1) {
              return false;
            }
          }
          node.insertArrayItem(idx, $('> ul', $nodeid).get(0));
          if ((boundaries.minItems <= 0) ||
              ((boundaries.minItems > 0) &&
                (node.children.length > boundaries.minItems - 1))) {
            $nodeid.find('> span > a._jsonform-array-deletelast')
              .removeClass('disabled');
          }
        });

        //Simulate Users click to setup the form with its minItems
        var curItems = $('> ul > li', $nodeid).length;
        if ((boundaries.minItems > 0) &&
            (curItems < boundaries.minItems)) {
          for (var i = 0; i < (boundaries.minItems - 1) && ($nodeid.find('> ul > li').length < boundaries.minItems); i++) {
            node.insertArrayItem(curItems, $nodeid.find('> ul').get(0));
          }
        }
        if ((boundaries.minItems > 0) &&
            (node.children.length <= boundaries.minItems)) {
          $nodeid.find('> span > a._jsonform-array-deletelast')
            .addClass('disabled');
        }

        $('> span > a._jsonform-array-deletelast', $nodeid).click(function (evt) {
          var idx = node.children.length - 1;
          evt.preventDefault();
          evt.stopPropagation();
          if (boundaries.minItems > 0) {
            if (node.children.length < boundaries.minItems + 2) {
              $nodeid.find('> span > a._jsonform-array-deletelast')
                .addClass('disabled');
            }
            if (node.children.length <= boundaries.minItems) {
              return false;
            }
          }
          else if (node.children.length === 1) {
            $nodeid.find('> span > a._jsonform-array-deletelast')
              .addClass('disabled');
          }
          node.deleteArrayItem(idx);
          if ((boundaries.maxItems >= 0) && (idx <= boundaries.maxItems - 1)) {
            $nodeid.find('> span > a._jsonform-array-addmore')
              .removeClass('disabled');
          }
        });

        // only allow drag if default or enabled
        if (!util.isSet(node.formElement.draggable) || node.formElement.draggable) {
          if ($(node.el).sortable) {
            $('> ul', $nodeid).sortable();
            $('> ul', $nodeid).bind('sortstop', function (event, ui) {
              var idx = $(ui.item).data('idx');
              var newIdx = $(ui.item).index();
              moveNodeTo(idx, newIdx);
            });
          }
        }
      }
    },
    'tabarray': {
      'template': '<div id="<%= id %>"><div class="tabbable tabs-left">' +
        '<ul class="nav nav-tabs">' +
          '<%= tabs %>' +
        '</ul>' +
        '<div class="tab-content">' +
          '<%= children %>' +
        '</div>' +
        '</div>' +
        '<a href="#" class="btn btn-default _jsonform-array-addmore"><i class="glyphicon glyphicon-plus-sign" title="Add new"></i></a> ' +
        '<a href="#" class="btn btn-default _jsonform-array-deleteitem"><i class="glyphicon glyphicon-minus-sign" title="Delete item"></i></a></div>',
      'fieldtemplate': true,
      'array': true,
      'childTemplate': function (inner) {
        return '<div data-idx="<%= node.childPos %>" class="tab-pane">' +
          inner +
          '</div>';
      },
      'onBeforeRender': function (data, node) {
        // Generate the initial 'tabs' from the children
        var tabs = '';
        util.each(node.children, function (child, idx) {
          var title = child.legend ||
            child.title ||
            ('Item ' + (idx+1));
          tabs += '<li data-idx="' + idx + '"' +
            ((idx === 0) ? ' class="active"' : '') +
            '><a class="draggable tab" data-toggle="tab" rel="' + escape(title) + '">' +
            langx.escapeHTML(title) +
            '</a></li>';
        });
        data.tabs = tabs;
      },
      'onInsert': function (evt, node) {
        var $nodeid = $(node.el).find('#' + util.escapeSelector(node.id));
        var boundaries = node.getArrayBoundaries();

        var moveNodeTo = function (fromIdx, toIdx) {
          // Note "switchValuesWith" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
          if (fromIdx === toIdx) return;
          var incr = (fromIdx < toIdx) ? 1: -1;
          var i = 0;
          var tabEl = $('> .tabbable > .tab-content', $nodeid).get(0);
          for (i = fromIdx; i !== toIdx; i += incr) {
            node.children[i].switchValuesWith(node.children[i + incr]);
            node.children[i].render(tabEl);
            node.children[i + incr].render(tabEl);
          }
        };


        // Refreshes the list of tabs
        var updateTabs = function (selIdx) {
          var tabs = '';
          var activateFirstTab = false;
          if (selIdx === undefined) {
            selIdx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
            if (selIdx) {
              selIdx = parseInt(selIdx, 10);
            }
            else {
              activateFirstTab = true;
              selIdx = 0;
            }
          }
          if (selIdx >= node.children.length) {
            selIdx = node.children.length - 1;
          }
          util.each(node.children, function (child, idx) {
            $('> .tabbable > .tab-content > [data-idx="' + idx + '"] > fieldset > legend', $nodeid).html(child.legend);
            var title = child.legend || child.title || ('Item ' + (idx+1));
            tabs += '<li data-idx="' + idx + '">' +
                    '<a class="draggable tab" data-toggle="tab" rel="' + escape(title) + '">' +
                    langx.escapeHTML(title) +
                    '</a></li>';
          });
          $('> .tabbable > .nav-tabs', $nodeid).html(tabs);
          if (activateFirstTab) {
            $('> .tabbable > .nav-tabs [data-idx="0"]', $nodeid).addClass('active');
          }
          $('> .tabbable > .nav-tabs [data-toggle="tab"]', $nodeid).eq(selIdx).click();
        };

        $('> a._jsonform-array-deleteitem', $nodeid).click(function (evt) {
          var idx = Number($('> .tabbable > .nav-tabs .active', $nodeid).data('idx'));
          evt.preventDefault();
          evt.stopPropagation();
          if (boundaries.minItems > 0) {
            if (node.children.length < boundaries.minItems + 1) {
              $nodeid.find('> a._jsonform-array-deleteitem')
                .addClass('disabled');
            }
            if (node.children.length <= boundaries.minItems) return false;
          }
          node.deleteArrayItem(idx);
          updateTabs();
          if ((node.children.length < boundaries.minItems + 1) ||
              (node.children.length === 0)) {
            $nodeid.find('> a._jsonform-array-deleteitem').addClass('disabled');
          }
          if ((boundaries.maxItems >= 0) &&
              (node.children.length <= boundaries.maxItems)) {
            $nodeid.find('> a._jsonform-array-addmore').removeClass('disabled');
          }
        });

        $('> a._jsonform-array-addmore', $nodeid).click(function (evt) {
          var idx = node.children.length;
          if (boundaries.maxItems>=0) {
            if (node.children.length>boundaries.maxItems-2) {
              $('> a._jsonform-array-addmore', $nodeid).addClass("disabled");
            }
            if (node.children.length > boundaries.maxItems - 1) {
              return false;
            }
          }
          evt.preventDefault();
          evt.stopPropagation();
          node.insertArrayItem(idx,
            $nodeid.find('> .tabbable > .tab-content').get(0));
          updateTabs(idx);
          if ((boundaries.minItems <= 0) ||
              ((boundaries.minItems > 0) && (idx > boundaries.minItems - 1))) {
            $nodeid.find('> a._jsonform-array-deleteitem').removeClass('disabled');
          }
        });

        $(node.el).on('legendUpdated', function (evt) {
          updateTabs();
          evt.preventDefault();
          evt.stopPropagation();
        });

        // only allow drag if default or enabled
        if (!util.isSet(node.formElement.draggable) || node.formElement.draggable) {
          if ($(node.el).sortable) {
            $('> .tabbable > .nav-tabs', $nodeid).sortable({
              containment: node.el,
              tolerance: 'pointer'
            });
            $('> .tabbable > .nav-tabs', $nodeid).bind('sortstop', function (event, ui) {
              var idx = $(ui.item).data('idx');
              var newIdx = $(ui.item).index();
              moveNodeTo(idx, newIdx);
              updateTabs(newIdx);
            });
          }
        }

        // Simulate User's click to setup the form with its minItems
        if ((boundaries.minItems >= 0)  &&
            (node.children.length <= boundaries.minItems)) {
          for (var i = 0; i < (boundaries.minItems - 1); i++) {
            $nodeid.find('> a._jsonform-array-addmore').click();
          }
          $nodeid.find('> a._jsonform-array-deleteitem').addClass('disabled');
          updateTabs();
        }

        if ((boundaries.maxItems >= 0) &&
            (node.children.length >= boundaries.maxItems)) {
          $nodeid.find('> a._jsonform-array-addmore').addClass('disabled');
        }
        if ((boundaries.minItems >= 0) &&
            (node.children.length <= boundaries.minItems)) {
          $nodeid.find('> a._jsonform-array-deleteitem').addClass('disabled');
        }
      }
    },
    'help': {
      'template':'<span class="help-block" style="padding-top:5px"><%= elt.helpvalue %></span>',
      'fieldtemplate': true
    },
    'msg': {
      'template': '<%= elt.msg %>'
    },
    'fieldset': {
      'template': '<fieldset class="form-group jsonform-error-<%= keydash %> <% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
        '<% if (id) { %> id="<%= id %>"<% } %>' +
        '>' +
        '<% if (node.title || node.legend) { %><legend role="treeitem" aria-expanded="false"><%= node.title || node.legend %></legend><% } %>' +
        '<% if (elt.expandable) { %><div class="form-group"><% } %>' +
        '<%= children %>' +
        '<% if (elt.expandable) { %></div><% } %>' +
        '</fieldset>',
      onInsert: function (evt, node) {
        if (node.el !== null) {
          $('.expandable > div, .expandable > fieldset', node.el).hide();
          // See #233
          $(".expandable", node.el).removeClass("expanded");
        }
      }
    },
    'advancedfieldset': {
      'template': '<fieldset' +
        '<% if (id) { %> id="<%= id %>"<% } %>' +
        ' class="expandable <%= elt.htmlClass?elt.htmlClass:"" %>">' +
        '<legend role="treeitem" aria-expanded="false"><%= (node.title || node.legend) ? (node.title || node.legend) : "Advanced options" %></legend>' +
        '<div class="form-group">' +
        '<%= children %>' +
        '</div>' +
        '</fieldset>',
      onInsert: function (evt, node) {
        if (node.el !== null) {
          $('.expandable > div, .expandable > fieldset', node.el).hide();
          // See #233
          $(".expandable", node.el).removeClass("expanded");
        }
      }
    },
    'authfieldset': {
      'template': '<fieldset' +
        '<% if (id) { %> id="<%= id %>"<% } %>' +
        ' class="expandable <%= elt.htmlClass?elt.htmlClass:"" %>">' +
        '<legend role="treeitem" aria-expanded="false"><%= (node.title || node.legend) ? (node.title || node.legend) : "Authentication settings" %></legend>' +
        '<div class="form-group">' +
        '<%= children %>' +
        '</div>' +
        '</fieldset>',
      onInsert: function (evt, node) {
        if (node.el !== null) {
          $('.expandable > div, .expandable > fieldset', node.el).hide();
          // See #233
          $(".expandable", node.el).removeClass("expanded");
        }
      }
    },
    'submit':{
      'template':'<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %>" value="<%= value || node.title %>"<%= (node.disabled? " disabled" : "")%>/>'
    },
    'button':{
      'template':' <button type="button" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-default <%= elt.htmlClass?elt.htmlClass:"" %>"><%= node.title %></button> '
    },
    'actions':{
      'template':'<div class="<%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>'
    },
    'hidden':{
      'template':'<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= escape(value) %>" />',
      'inputfield': true
    },
    'tabs':{
      'template':'<ul class="nav nav-tabs <%= elt.htmlClass?elt.htmlClass:"" %>"' +
      '<% if (elt.id) { %> id="<%= elt.id %>"<% } %>' +
      '><%=tab_list%></ul><div class="tab-content" <% if (elt.id) { %> data-tabset="<%= elt.id %>"<% } %>><%=children%></div>',
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onBeforeRender': function (data, node) {
        // Generate the initial 'tabs' from the children
        var parentID = langx.escapeHTML(node.id ? node.id + "-" : "")
        var tab_list = '';
        util.each(node.children, function (child, idx) {
          var title = langx.escapeHTML(child.title || ('Item ' + (idx+1)));
          var title_escaped = title.replace(" ","_");
          tab_list += '<li class="nav-item' +
            ((idx === 0) ? ' active' : '') + '">' +
            '<a href="#'+ parentID + title_escaped +'" class="nav-link"' +
            ' data-tab="' + parentID + title_escaped + '"' +
            ' data-toggle="tab">' + title +
            '</a></li>';
        });
        data.tab_list = tab_list;
        return data;
      },
      'onInsert': function(evt, node){
        $("#"+node.id+">li.nav-item").on("click", function(e){
          e.preventDefault();
          $(node.el).find("div[data-tabset='"+node.id+"']>div.tab-pane.active").each(function(){
            $(this).removeClass("active");
          })
          var tab_id = $(this).find('a').attr('data-tab');
          $("#"+tab_id).addClass("active");
        });
      }
    },
    'tab':{
      'template': '<div class="tab-pane' +
      '<% if (elt.htmlClass) { %> <%= elt.htmlClass %> <% } %>' +
          //Set the first tab as active
      '<% if (node.childPos === 0) { %> active<% } %>' +
      '"' + //Finish end quote of class tag
      '<% if (node.title) { %> id="<%= node.parentNode.id %>-<%= node.title.replace(" ","_") %>"<% } %>' +
      '><%= children %></div>'
    },
    'selectfieldset': {
      'template': '<fieldset class="tab-container <%= elt.htmlClass?elt.htmlClass:"" %>">' +
        '<% if (node.legend) { %><legend role="treeitem" aria-expanded="false"><%= node.legend %></legend><% } %>' +
        '<% if (node.formElement.key) { %><input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" /><% } else { %>' +
          '<a id="<%= node.id %>"></a><% } %>' +
        '<div class="tabbable">' +
          '<div class="form-group<%= node.formElement.hideMenu ? " hide" : "" %>">' +
            '<% if (!elt.notitle) { %><label for="<%= node.id %>"><%= node.title ? node.title : node.name %></label><% } %>' +
            '<div class="controls"><%= tabs %></div>' +
          '</div>' +
          '<div class="tab-content">' +
            '<%= children %>' +
          '</div>' +
        '</div>' +
        '</fieldset>',
      'inputfield': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'childTemplate': function (inner) {
        return '<div data-idx="<%= node.childPos %>" class="tab-pane' +
          '<% if (node.active) { %> active<% } %>">' +
          inner +
          '</div>';
      },
      'onBeforeRender': function (data, node) {
        // Before rendering, this function ensures that:
        // 1. direct children have IDs (used to show/hide the tabs contents)
        // 2. the tab to active is flagged accordingly. The active tab is
        // the first one, except if form values are available, in which case
        // it's the first tab for which there is some value available (or back
        // to the first one if there are none)
        // 3. the HTML of the select field used to select tabs is exposed in the
        // HTML template data as "tabs"

        var children = null;
        var choices = [];
        if (node.schemaElement) {
          choices = node.schemaElement['enum'] || [];
        }
        if (node.options) {
          children = langx.map(node.options, function (option, idx) {
            var child = node.children[idx];
            child.childPos = idx; // When nested the childPos is always 0.
            if (option instanceof Object) {
              option = langx.extend({ node: child }, option);
              option.title = option.title ||
                child.legend ||
                child.title ||
                ('Option ' + (child.childPos+1));
              option.value = util.isSet(option.value) ? option.value :
                util.isSet(choices[idx]) ? choices[idx] : idx;
              return option;
            }
            else {
              return {
                title: option,
                value: util.isSet(choices[child.childPos]) ?
                  choices[child.childPos] :
                  child.childPos,
                node: child
              };
            }
          });
        }
        else {
          children = langx.map(node.children, function (child, idx) {
            child.childPos = idx; // When nested the childPos is always 0.
            return {
              title: child.legend || child.title || ('Option ' + (child.childPos+1)),
              value: choices[child.childPos] || child.childPos,
              node: child
            };
          });
        }

        // Reset each children to inactive so that they are not shown on insert
        // The active one will then be shown later one. This is useful when sorting
        // arrays with selectfieldset, otherwise both fields could be active at the
        // same time.
        util.each(children, function (child, idx) {
          child.node.active = false
        });

        var activeChild = null;
        if (data.value) {
          activeChild = langx.find(children, function (child) {
            return (child.value === node.value);
          });
        }
        if (!activeChild) {
          activeChild = langx.find(children, function (child) {
            return child.node.hasNonDefaultValue();
          });
        }
        if (!activeChild) {
          activeChild = children[0];
        }
        activeChild.node.active = true;
        data.value = activeChild.value;

        var elt = node.formElement;
        var tabs = '<select class="nav form-control"' +
          (node.disabled ? ' disabled' : '') +
          '>';
        util.each(children, function (child, idx) {
          tabs += '<option data-idx="' + idx + '" value="' + child.value + '"' +
            (child.node.active ? ' selected="selected" class="active"' : '') +
            '>' +
            langx.escapeHTML(child.title) +
            '</option>';
        });
        tabs += '</select>';

        data.tabs = tabs;
        return data;
      },
      'onInsert': function (evt, node) {
        $(node.el).find('select.nav').first().on('change', function (evt) {
          var $option = $(this).find('option:selected');
          $(node.el).find('input[type="hidden"]').first().val($option.attr('value'));
        });
      }
    },
    'optionfieldset': {
      'template': '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
        '>' +
        '<%= children %>' +
        '</div>'
    },
    'section': {
      'template': '<div' +
        '<% if (elt.htmlClass) { %> class="<%= elt.htmlClass %>"<% } %>' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
        '><%= children %></div>'
    },

    /**
     * A "questions" field renders a series of question fields and binds the
     * result to the value of a schema key.
     */
    'questions': {
      'template': '<div>' +
        '<input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" />' +
        '<%= children %>' +
        '</div>',
      'fieldtemplate': true,
      'inputfield': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'onInsert': function (evt, node) {
        if (!node.children || (node.children.length === 0)) return;
        util.each(node.children, function (child) {
          $(child.el).hide();
        });
        $(node.children[0].el).show();
      }
    },

    /**
     * A "question" field lets user choose a response among possible choices.
     * The field is not associated with any schema key. A question should be
     * part of a "questions" field that binds a series of questions to a
     * schema key.
     */
    'question': {
      'template': '<div id="<%= node.id %>"><% _.forEach(node.options, function(key, val) { %><label class="<%= (node.formElement.optionsType === "radiobuttons") ? "btn btn-default" : "" %><%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>"><input type="radio" <% if (node.formElement.optionsType === "radiobuttons") { %> style="position:absolute;left:-9999px;" <% } %>name="<%= node.id %>" value="<%= val %>"<%= (node.disabled? " disabled" : "")%>/><span><%= (key instanceof Object ? key.title : key) %></span></label> <% }); %></div>',
      'fieldtemplate': true,
      'onInsert': function (evt, node) {
        var activeClass = 'active';
        var elt = node.formElement || {};
        if (elt.activeClass) {
          activeClass += ' ' + elt.activeClass;
        }

        // Bind to change events on radio buttons
        $(node.el).find('input[type="radio"]').on('change', function (evt) {
          var questionNode = null;
          var option = node.options[$(this).val()];
          if (!node.parentNode || !node.parentNode.el) return;

          $(this).parent().parent().find('label').removeClass(activeClass);
          $(this).parent().addClass(activeClass);
          $(node.el).nextAll().hide();
          $(node.el).nextAll().find('input[type="radio"]').prop('checked', false);

          // Execute possible actions (set key value, form submission, open link,
          // move on to next question)
          if (option.value) {
            // Set the key of the 'Questions' parent
            $(node.parentNode.el).find('input[type="hidden"]').val(option.value);
          }
          if (option.next) {
            questionNode = langx.find(node.parentNode.children, function (child) {
              return (child.formElement && (child.formElement.qid === option.next));
            });
            $(questionNode.el).show();
            $(questionNode.el).nextAll().hide();
            $(questionNode.el).nextAll().find('input[type="radio"]').prop('checked', false);
          }
          if (option.href) {
            if (option.target) {
              window.open(option.href, option.target);
            }
            else {
              window.location = option.href;
            }
          }
          if (option.submit) {
            setTimeout(function () {
              node.ownerTree.submit();
            }, 0);
          }
        });
      }
    }
  };

  return jsonform.elementTypes;
});
