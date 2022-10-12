/**
 * skylark-jsonform - A version of jsonform that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-jsonform/
 * @license MIT
 */
define(["skylark-jquery","./jsonform"],function(r,e){return e.getFormValue=function(e){var o=r(e).data("jsonform-tree");return o?o.root.getFormValues():null},e.getFormValue});
//# sourceMappingURL=sourcemaps/get-form-value.js.map
