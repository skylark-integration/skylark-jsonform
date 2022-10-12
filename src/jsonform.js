define([
  "skylark-langx-ns",
  "skylark-jquery"
],function(skylark,$) {


    /**
     * The jsonform object whose methods will be exposed to the window object
     */
    var jsonform = {util:{}};




  return skylark.attach("intg.jsonform",jsonform);

});