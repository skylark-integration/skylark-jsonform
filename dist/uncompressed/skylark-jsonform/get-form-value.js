define([
  "skylark-jquery",
  "./jsonform"
],function($,jsonform){


	//3652-3667
	/**
	 * Returns the structured object that corresponds to the form values entered
	 * by the use for the given form.
	 *
	 * The form must have been previously rendered through a call to jsonform.
	 *
	 * @function
	 * @param {Node} The <form> tag in the DOM
	 * @return {Object} The object that follows the data schema and matches the
	 *  values entered by the user.
	 */
	jsonform.getFormValue = function (formelt) {
	  var form = $(formelt).data('jsonform-tree');
	  if (!form) return null;
	  return form.root.getFormValues();
	};

	return jsonform.getFormValue;
});