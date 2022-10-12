/**
 * skylark-jsonform - A version of jsonform that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-jsonform/
 * @license MIT
 */
define(["skylark-langx","./jsonform","./util"],function(e,t,a){var l=function(t,n,u,i,r){var s=null;(i=i||{}).idx=i.idx||(u?u[u.length-1]:1),i.value=a.isSet(i.value)?i.value:"",i.getValue=i.getValue||function(e){return l(t,e,u,i,r)};var g=function(t,l){var n=null;return t&&t.length?(a.each(t,function(t){n||(t!==l?e.isString(t)||(t.key===l?n=t:t.items&&(n=g(t.items,l))):n={key:t})}),n):null},v=g(t.form||[],n),m=a.getSchemaKey(t.schema.properties,n);return r&&t.value&&(s=a.getObjKey(t.value,a.applyArrayPath(n,u))),a.isSet(s)||(v&&void 0!==v.value?s=v.value:m&&a.isSet(m.default)&&(s=m.default),s&&-1!==s.indexOf("{{values.")&&(s=s.replace(/\{\{values\.([^\}]+)\}\}/g,'{{getValue("$1")}}')),s&&(s=e.template(s,valueTemplateSettings)(i))),isSet(s)&&v&&a.hasOwnProperty(v.titleMap,s)&&(s=e.template(v.titleMap[s],valueTemplateSettings)(i)),s&&_.isString(s)&&m&&m.maxLength&&s.length>m.maxLength&&(s=s.substr(0,m.maxLength-1)+"…"),a.isSet(s)?s:null};return t.getInitialValue=l});
//# sourceMappingURL=sourcemaps/get-initial-value.js.map
