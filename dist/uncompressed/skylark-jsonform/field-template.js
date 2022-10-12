define([
  "./jsonform"
],function(jsonform){
  //210-245
  // Twitter bootstrap-friendly HTML boilerplate for standard inputs
  function fieldTemplate(inner) {
    return '<div ' +
      '<% for(var key in elt.htmlMetaData) {%>' +
        '<%= key %>="<%= elt.htmlMetaData[key] %>" ' +
      '<% }%>' +
      'class="form-group jsonform-error-<%= keydash %>' +
      '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " jsonform-required" : "") %>' +
      '<%= (node.readOnly ? " jsonform-readonly" : "") %>' +
      '<%= (node.disabled ? " jsonform-disabled" : "") %>' +
      '">' +
      '<% if (!elt.notitle) { %>' +
        '<label for="<%= node.id %>"><%= node.title ? node.title : node.name %></label>' +
      '<% } %>' +
      '<div class="controls">' +
        '<% if (node.prepend || node.append) { %>' +
        '<div class="<% if (node.prepend) { %>input-group<% } %>' +
          '<% if (node.append) { %> input-group<% } %>">' +
          '<% if (node.prepend) { %>' +
            '<span class="input-group-addon"><%= node.prepend %></span>' +
          '<% } %>' +
        '<% } %>' +
        inner +
        '<% if (node.append) { %>' +
          '<span class="input-group-addon"><%= node.append %></span>' +
        '<% } %>' +
        '<% if (node.prepend || node.append) { %>' +
          '</div>' +
        '<% } %>' +
        '<% if (node.description) { %>' +
          '<span class="help-block"><%= node.description %></span>' +
        '<% } %>' +
        '<span class="help-block jsonform-errortext" style="display:none;"></span>' +
      '</div></div>';
  }

  return jsonform.fieldTemplate = fieldTemplate;
});
