/**
 * skylark-jsonform - A version of jsonform that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-jsonform/
 * @license MIT
 */
define(["skylark-langx-types","skylark-langx-objects","skylark-langx-funcs","skylark-langx-arrays","skylark-langx-strings","skylark-langx","skylark-jquery","./jsonform","./util"],function(e,t,i,n,l,a,s,r,h){var o=function(){this.id=null,this.key=null,this.el=null,this.formElement=null,this.schemaElement=null,this.view=null,this.children=[],this.ownerTree=null,this.parentNode=null,this.childTemplate=null,this.legendChild=null,this.arrayPath=[],this.childPos=0};return o.prototype.clone=function(e){var i=new o;return i.arrayPath=t.clone(this.arrayPath),i.ownerTree=this.ownerTree,i.parentNode=e||this.parentNode,i.formElement=this.formElement,i.schemaElement=this.schemaElement,i.view=this.view,i.children=n.map(this.children,function(e){return e.clone(i)}),this.childTemplate&&(i.childTemplate=this.childTemplate.clone(i)),i},o.prototype.hasNonDefaultValue=function(){return(!this.formElement||"hidden"!=this.formElement.type)&&(!(!this.value||this.defaultValue)||!!this.children.find(function(e){return e.hasNonDefaultValue()}))},o.prototype.appendChild=function(e){return e.parentNode=this,e.childPos=this.children.length,this.children.push(e),e},o.prototype.removeChild=function(){var e=this.children[this.children.length-1];if(e)return s(e.el).remove(),this.children.pop()},o.prototype.moveValuesTo=function(e){var t=this.getFormValues(e.arrayPath);e.resetValues(),e.computeInitialValues(t,!0)},o.prototype.switchValuesWith=function(e){var t=this.getFormValues(e.arrayPath),i=e.getFormValues(this.arrayPath);e.resetValues(),e.computeInitialValues(t,!0),this.resetValues(),this.computeInitialValues(i,!0)},o.prototype.resetValues=function(){var e=null;if(this.value=null,this.parentNode?(this.arrayPath=t.clone(this.parentNode.arrayPath),this.parentNode.view&&this.parentNode.view.array&&this.arrayPath.push(this.childPos)):this.arrayPath=[],this.view&&this.view.inputfield)e=s(":input",this.el).serializeArray(),h.each(e,function(e){s('[name="'+h.escapeSelector(e.name)+'"]',s(this.el)).val("")},this);else if(this.view&&this.view.array)for(;this.children.length>0;)this.removeChild();h.each(this.children,function(e){e.resetValues()})},o.prototype.setChildTemplate=function(e){this.childTemplate=e,e.parentNode=this},o.prototype.computeInitialValues=function(i,s){var r=this,o=null,m=1,u=0,p=this.ownerTree.formDesc.tpldata||{};if(this.parentNode?(this.arrayPath=t.clone(this.parentNode.arrayPath),this.parentNode.view&&this.parentNode.view.array&&this.arrayPath.push(this.childPos)):this.arrayPath=[],p.idx=this.arrayPath.length>0?this.arrayPath[this.arrayPath.length-1]+1:this.childPos+1,p.value="",p.getValue=function(e){if(!i)return"";var t,n=i,l=e.split("[].");for(t=0;t<l.length-1;t++)n=n[l[t]][r.arrayPath[t]];return n[l[t]]},this.formElement&&(this.formElement.id?this.id=h.applyArrayPath(this.formElement.id,this.arrayPath):this.view&&this.view.array?this.id=h.escapeSelector(this.ownerTree.formDesc.prefix)+"-elt-counter-"+l.uniqueId():this.parentNode&&this.parentNode.view&&this.parentNode.view.array?this.id=h.escapeSelector(this.ownerTree.formDesc.prefix)+"-elt-counter-"+l.uniqueId():"button"!==this.formElement.type&&"selectfieldset"!==this.formElement.type&&"question"!==this.formElement.type&&"buttonquestion"!==this.formElement.type||(this.id=h.escapeSelector(this.ownerTree.formDesc.prefix)+"-elt-counter-"+l.uniqueId()),this.formElement.key&&(this.key=h.applyArrayPath(this.formElement.key,this.arrayPath),this.keydash=h.slugify(this.key.replace(/\./g,"---"))),this.name=h.applyArrayPath(this.formElement.name,this.arrayPath),h.each(["title","legend","description","append","prepend","inlinetitle","helpvalue","value","disabled","placeholder","readOnly"],t=>{e.isString(this.formElement[t])?(-1!==this.formElement[t].indexOf("{{values.")?this[t]=this.formElement[t].replace(/\{\{values\.([^\}]+)\}\}/g,'{{getValue("$1")}}'):this[t]=h.applyArrayPath(this.formElement[t],this.arrayPath),this[t]&&(this[t]=a.template(this[t],h.valueTemplateSettings)(p))):this[t]=this.formElement[t]}),this.formElement.options&&(this.options=n.map(this.formElement.options,function(i){var n=null;return e.isObject(i)&&i.title?(n=-1!==i.title.indexOf("{{values.")?i.title.replace(/\{\{values\.([^\}]+)\}\}/g,'{{getValue("$1")}}'):h.applyArrayPath(i.title,r.arrayPath),t.extend({},i,{value:h.isSet(i.value)?i.value:"",title:a.template(n,h.valueTemplateSettings)(p)})):i}))),this.view&&this.view.inputfield&&this.schemaElement)i?h.isSet(h.getObjKey(i,this.key))?this.value=h.getObjKey(i,this.key):h.isSet(this.schemaElement.default)&&(this.value=this.schemaElement.default,"string"==typeof this.value&&(this.value=a.template(this.value,h.valueTemplateSettings)(p))):s||!h.isSet(this.value)&&h.isSet(this.schemaElement.default)&&(this.value=this.schemaElement.default,e.isString(this.value)&&(-1!==this.value.indexOf("{{values.")?this.value=this.value.replace(/\{\{values\.([^\}]+)\}\}/g,'{{getValue("$1")}}'):this.value=h.applyArrayPath(this.value,this.arrayPath),this.value&&(this.value=a.template(this.value,h.valueTemplateSettings)(p))),this.defaultValue=!0);else if(this.view&&this.view.array)for(m=0,i?m=this.getPreviousNumberOfItems(i,this.arrayPath):0===m&&(m=1),u=0;u<m;u++)this.appendChild(this.childTemplate.clone());if(h.each(this.children,function(e){e.computeInitialValues(i,s)}),this.formElement&&this.formElement.valueInLegend)for(o=this;o;){if(o.parentNode&&o.parentNode.view&&o.parentNode.view.array&&(o.legendChild=this,o.formElement&&o.formElement.legend)){o.legend=h.applyArrayPath(o.formElement.legend,o.arrayPath),p.idx=o.arrayPath.length>0?o.arrayPath[o.arrayPath.length-1]+1:o.childPos+1,p.value=h.isSet(this.value)?this.value:"",o.legend=a.template(o.legend,h.valueTemplateSettings)(p);break}o=o.parentNode}},o.prototype.getPreviousNumberOfItems=function(e,t){var i=null,l=null,a=null;return e?this.view.inputfield&&this.schemaElement?(i=function(e,t){var i=0,n=0;if(!e)return null;if(t>0)for(;i<t;){if(-1===(n=e.indexOf("[]",n)))return e;n+=2,i+=1}return-1===(n=e.indexOf("[]",n))?e:e.substring(0,n)}(this.formElement.key,t.length),i=h.applyArrayPath(i,t),(l=r.util.getObjKey(e,i))?(a=n.map(this.children,function(i){return i.getPreviousNumberOfItems(e,t)}),h.max([h.max(a)||0,l.length])):0):this.view.array?this.childTemplate.getPreviousNumberOfItems(e,t):(a=n.map(this.children,function(i){return i.getPreviousNumberOfItems(e,t)}),h.max(a)||0):0},o.prototype.getFormValues=function(t){var i={};if(!this.el)throw new Error("formNode.getFormValues can only be called on nodes that are associated with a DOM element in the tree");var n=s(":input",this.el).serializeArray();n=n.concat(s(":input[type=checkbox]:not(:disabled):not(:checked)",this.el).map(function(){return{name:this.name,value:this.checked}}).get()),t&&h.each(n,function(e){e.name=h.applyArrayPath(e.name,t)});for(var l=this.ownerTree.formDesc.schema,a=0;a<n.length;a++){var o=n[a].name,m=h.getSchemaKey(l.properties,o),u=null,p=null;if(m)if(m._jsonform_checkboxes_as_array&&(u=o.match(/\[([0-9]*)\]$/)))o=o.replace(/\[([0-9]*)\]$/,""),p=r.util.getObjKey(i,o)||[],"1"===n[a].value&&p.push(m.enum[parseInt(u[1],10)]),r.util.setObjKey(i,o,p);else{if("boolean"===m.type&&("0"===n[a].value?n[a].value=!1:n[a].value=!!n[a].value),"number"!==m.type&&"integer"!==m.type||e.isString(n[a].value)&&(n[a].value.length?isNaN(Number(n[a].value))||(n[a].value=Number(n[a].value)):n[a].value=null),"string"!==m.type||""!==n[a].value||m._jsonform_allowEmpty||(n[a].value=null),"object"===m.type&&e.isString(n[a].value)&&"{"===n[a].value.substring(0,1))try{n[a].value=JSON.parse(n[a].value)}catch(e){n[a].value={}}"object"!==m.type||"null"!==n[a].value&&""!==n[a].value||(n[a].value=null),n[a].name&&null!==n[a].value&&r.util.setObjKey(i,n[a].name,n[a].value)}}return i},o.prototype.render=function(e){var t=this.generate();this.setContent(t,e),this.enhance()},o.prototype.setContent=function(e,t){var i=s(e),n=t||(this.parentNode?this.parentNode.el:this.ownerTree.domRoot),l=null;this.el?s(this.el).replaceWith(i):(l=s(n).children().get(this.childPos))?s(l).before(i):s(n).append(i),this.el=i,this.updateElement(this.el)},o.prototype.updateElement=function(e){this.id&&(this.el=s("#"+h.escapeSelector(this.id),e).get(0),this.view&&this.view.getElement&&(this.el=this.view.getElement(this.el)),!1!==this.fieldtemplate&&this.view&&this.view.fieldtemplate&&(this.el=s(this.el).parent().parent(),(this.prepend||this.prepend)&&(this.el=this.el.parent()),this.el=this.el.get(0)),this.parentNode&&this.parentNode.view&&this.parentNode.view.childTemplate&&(this.el=s(this.el).parent().get(0)));for(const t in this.children)0!=this.children.hasOwnProperty(t)&&this.children[t].updateElement(this.el||e)},o.prototype.generate=function(){var e={id:this.id,keydash:this.keydash,elt:this.formElement,schema:this.schemaElement,node:this,value:h.isSet(this.value)?this.value:"",escape:l.escapeHTML},t=null;this.ownerTree.formDesc.onBeforeRender&&this.ownerTree.formDesc.onBeforeRender(e,this),this.view.onBeforeRender&&this.view.onBeforeRender(e,this),t=this.template?this.template:this.formElement&&this.formElement.template?this.formElement.template:this.view.template,!1!==this.fieldtemplate&&(this.fieldtemplate||this.view.fieldtemplate)&&(t=r.fieldTemplate(t)),this.parentNode&&this.parentNode.view&&this.parentNode.view.childTemplate&&(t=this.parentNode.view.childTemplate(t,!h.isSet(this.parentNode.formElement.draggable)||this.parentNode.formElement.draggable));var i="";return h.each(this.children,function(e){i+=e.generate()}),e.children=i,e.fieldHtmlClass="",this.ownerTree&&this.ownerTree.formDesc&&this.ownerTree.formDesc.params&&this.ownerTree.formDesc.params.fieldHtmlClass&&(e.fieldHtmlClass=this.ownerTree.formDesc.params.fieldHtmlClass),this.formElement&&void 0!==this.formElement.fieldHtmlClass&&(e.fieldHtmlClass=this.formElement.fieldHtmlClass),a.template(t,h.fieldTemplateSettings)(e)},o.prototype.enhance=function(){var e=this,i=null,n=null,l=t.clone(this.ownerTree.formDesc.tpldata)||{};if(this.formElement&&(this.view.onInsert&&this.view.onInsert({target:s(this.el)},this),i=this.handlers||this.formElement.handlers,(n=this.onInsert||this.formElement.onInsert)&&n({target:s(this.el)},this),i&&h.each(i,function(e,t){"insert"===t&&e({target:s(this.el)},this)},this),this.el&&(this.onChange&&s(this.el).bind("change",function(t){e.onChange(t,e)}),this.view.onChange&&s(this.el).bind("change",function(t){e.view.onChange(t,e)}),this.formElement.onChange&&s(this.el).bind("change",function(t){e.formElement.onChange(t,e)}),this.onInput&&s(this.el).bind("input",function(t){e.onInput(t,e)}),this.view.onInput&&s(this.el).bind("input",function(t){e.view.onInput(t,e)}),this.formElement.onInput&&s(this.el).bind("input",function(t){e.formElement.onInput(t,e)}),this.onClick&&s(this.el).bind("click",function(t){e.onClick(t,e)}),this.view.onClick&&s(this.el).bind("click",function(t){e.view.onClick(t,e)}),this.formElement.onClick&&s(this.el).bind("click",function(t){e.formElement.onClick(t,e)}),this.onKeyUp&&s(this.el).bind("keyup",function(t){e.onKeyUp(t,e)}),this.view.onKeyUp&&s(this.el).bind("keyup",function(t){e.view.onKeyUp(t,e)}),this.formElement.onKeyUp&&s(this.el).bind("keyup",function(t){e.formElement.onKeyUp(t,e)}),i&&h.each(i,function(t,i){"insert"!==i&&s(this.el).bind(i,function(i){t(i,e)})},this)),this.legendChild&&this.legendChild.formElement)){var r=function(t){e.formElement&&e.formElement.legend&&e.parentNode&&(e.legend=h.applyArrayPath(e.formElement.legend,e.arrayPath),l.idx=e.arrayPath.length>0?e.arrayPath[e.arrayPath.length-1]+1:e.childPos+1,l.value=s(t.target).val(),e.legend=a.template(e.legend,h.valueTemplateSettings)(l),s(e.parentNode.el).trigger("legendUpdated"))};s(this.legendChild.el).bind("change",r),s(this.legendChild.el).bind("keyup",r)}h.each(this.children,function(e){e.enhance()})},o.prototype.insertArrayItem=function(e,t){var i=0;void 0===e&&(e=this.children.length);var n=this.childTemplate.clone();for(this.appendChild(n),n.resetValues(),i=this.children.length-2;i>=e;i--)this.children[i].moveValuesTo(this.children[i+1]);for(this.children[e].resetValues(),this.children[e].computeInitialValues(),i=e;i<this.children.length;i++)this.children[i].render(t)},o.prototype.deleteArrayItem=function(e){var t=0;for(void 0===e&&(e=this.children.length-1),t=e;t<this.children.length-1;t++)this.children[t+1].moveValuesTo(this.children[t]),this.children[t].render();this.removeChild()},o.prototype.getArrayBoundaries=function(){if(!this.view||!this.view.array)return{minItems:-1,maxItems:-1};var e=function(t,i){var n=null,l=null,a={minItems:-1,maxItems:-1};return i=i||t,t.view&&t.view.array&&t!==i?a:t.key?(l=t.key.replace(/\[[0-9]+\]/g,"[]"),t!==i&&(l=l.replace(/\[\][^\[\]]*$/,"")),(n=h.getSchemaKey(t.ownerTree.formDesc.schema.properties,l))?{minItems:n.minItems||n.minLength||-1,maxItems:n.maxItems||n.maxLength||-1}:a):(h.each(t.children,function(t){var n=e(t,i);-1!==n.minItems&&(-1!==a.minItems?a.minItems=Math.max(a.minItems,n.minItems):a.minItems=n.minItems),-1!==n.maxItems&&(-1!==a.maxItems?a.maxItems=Math.min(a.maxItems,n.maxItems):a.maxItems=n.maxItems)}),a)};return e(this)},r.formNode=o});
//# sourceMappingURL=sourcemaps/form-node.js.map