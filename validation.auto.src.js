/*!
 * validation.js v0.1.0
 * http://snandy.github.io/validation
 * @snandy 2013-06-17 17:27:40
 *
 */
~function(win, doc, undefined) {

var toString = Object.prototype.toString
var Util = {}

// Iterator
var forEach = Util.forEach = function(obj, iterator, context) {
	if ( obj.length === +obj.length ) {
		for (var i=0; i<obj.length; i++) {
			if (iterator.call(context, obj[i], i, obj) === true) return
		}
	} else {
		for (var k in obj) {
			if (iterator.call(context, obj[k], k, obj) === true) return
		}
	}
}

// IO.isArray, IO.isBoolean, ...
forEach(['Array', 'Boolean', 'Function', 'Object', 'String', 'Number'], function(name) {
	Util['is' + name] = function(obj) {
		return toString.call(obj) === '[object ' + name + ']'
	}
})
	
// field type
var TYPE = {
	textarea: 1,
	text: 2,
	password: 3,
	checkbox: 4,
	select: 5,
	file: 6	
}

// empty function
function noop() {}

// If the jQuery exists, use it
function $(selector) {
	return win.jQuery ? win.jQuery(selector)[0] : doc.getElementById(selector)
}

// Error class
function ZVError(errorMsg) {
	this.message = errorMsg
	this.name = 'ValidationError'
}

var Validate = {
	presence: function(val, option) {
		var option = option || {}
		var msg = option.failureMsg || '不能为空!'
		if (val === '' || val === null || val === undefined) {
			Validate.fail(msg)
		}
		return true
	},
	numericality: function(val, option) {
		var suppliedVal = val
		var val = Number(val)
		var option = option || {}
		var min = ((option.min) || (option.min === 0)) ? option.min : null
		var max = ((option.max) || (option.max === 0)) ? option.max : null
		var is  = ((option.is)  || (option.is === 0))  ? option.is  : null
		var notANumberMsg   = option.notANumberMsg   || '必须是数字!'
		var notAnIntegerMsg = option.notAnIntegerMsg || '必须为整数!'
		var wrongNumberMsg  = option.wrongNumberMsg  || '必须为' + is + '!'
		var tooLowMsg       = option.tooLowMsg       || '不能小于' + min + '!'
		var tooHighMsg      = option.tooHighMsg      || '不能大于' + max + '!'
		
		if ( !isFinite(val) ) Validate.fail(notANumberMsg)
		
		if ( option.onlyInteger && (/\.0+$|\.$/.test(String(suppliedVal)) || val != parseInt(val)) ) {
			Validate.fail(notAnIntegerMsg)
		}
		
		switch (true) {
			case (is !== null):
				if (val != Number(is)) Validate.fail(wrongNumberMsg)
				break
			case (min !== null && max !== null):
				Validate.numericality(val, {tooLowMsg: tooLowMsg, min: min})
				Validate.numericality(val, {tooHighMsg: tooHighMsg, max: max})
				break
			case (min !== null):
				if (val < Number(min)) Validate.fail(tooLowMsg)
				break
			case (max !== null):
				if (val > Number(max)) Validate.fail(tooHighMsg)
				break
		}
		return true
	},
	format: function(val, option) {
		var val = String(val)
		var option = option || {}
		var message = option.failureMsg || '格式不对!'
		var pattern = option.pattern || /./
		var negate = option.negate || false
		if (!negate && !pattern.test(val)) Validate.fail(message) // normal
		if (negate && pattern.test(val)) Validate.fail(message)   // negated
		return true
	},
	email: function(val, option) {
		var option = option || {}
		var reg = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i
		var message = option.failureMsg || '必须为一个有效的电子邮箱地址!'
		Validate.format(val, {failureMsg: message, pattern: reg})
		return true
	},
	size: function(val, option) {
		var val = String(val)
		var option = option || {}
		var min = ((option.min) || (option.min == 0)) ? option.min : null
		var max = ((option.max) || (option.max == 0)) ? option.max : null
		var is  = ((option.is)  || (option.is == 0))  ? option.is  : null
		var wrongLengthMessage = option.wrongLengthMessage || '必须是' + is + '个字符长度!'
		var tooShortMessage    = option.tooShortMessage || '不能小于' + min + '个字符长度!'
		var tooLongMessage     = option.tooLongMessage || '不能大于' + max + '个字符长度!'
		switch (true) {
			case (is !== null):
				if ( val.length != Number(is) ) Validate.fail(wrongLengthMessage)
				break
			case (min !== null && max !== null):
				Validate.size(val, {tooShortMessage: tooShortMessage, min: min})
				Validate.size(val, {tooLongMessage: tooLongMessage, max: max})
				break
			case (min !== null):
				if ( val.length < Number(min) ) Validate.fail(tooShortMessage)
				break
			case (max !== null):
				if ( val.length > Number(max) ) Validate.fail(tooLongMessage)
				break
			default:
				throw new Error('Validate::size - size(s) to validate against must be provided!')
		}
		return true
	},
	inclusion: function(val, option) {
		var option = option || {}
		var message = option.failureMsg || '必须是列表中指定的元素!'
		var caseSensitive = (option.caseSensitive === false) ? false : true
		if (option.allowNull && val == null) {
			return true
		}
		if (!option.allowNull && val == null) {
			Validate.fail(message)
		}
		var within = option.within || []
		//if case insensitive, make all strings in the array lowercase, and the val too
		if (!caseSensitive) { 
			var lowerWithin = []
			for (var j = 0, length = within.length; j < length; ++j) {
				var item = within[j]
				if ( Util.isString(item) ) {
					item = item.toLowerCase()
				}
				lowerWithin.push(item)
			}
			within = lowerWithin;
			if ( Util.isString(val) ) {
				val = val.toLowerCase()
			}
		}
		var found = false
		for (var i = 0, length = within.length; i < length; ++i) {
			if (within[i] == val) found = true
			if (option.partialMatch) {
				if (val.indexOf(within[i]) != -1) found = true
			}
		}
		if ( (!option.negate && !found) || (option.negate && found) ) {
			Validate.fail(message)
		}
		return true
	},
	exclusion: function(val, option) {
		var option = option || {}
		option.failureMsg = option.failureMsg || '不能输入列表中的元素!'
		option.negate = true
		Validate.inclusion(val, option)
		return true
	},
	confirmation: function(val, option) {
		if (!option.match) {
			throw new Error('Error validating confirmation: Id of element to match must be provided')
		}
		var option = option || {}
		var message = option.failureMsg || '两次输入不一致!'
		var match = option.match.nodeName ? option.match : $(option.match)
		if (!match) {
			throw new Error('There is no reference with name of, or element with id of ' + option.match)
		}
		if (val != match.value) Validate.fail(message)
		
		return true
	},
	acceptance: function(val, option) {
		var option = option || {}
		var message = option.failureMsg || '必须同意!'
		if (!val) {
			Validate.fail(message)
		}
		return true
	},
	fail: function(errorMsg) {
		throw new ZVError(errorMsg)
	}
};

function Validation(elem, option) {
	if (!elem) return
	this.element = elem.nodeName ? elem : $(elem)
	if (!this.element) throw new Error('element is not exits')
	this.initialize(option)
}

Validation.add = function(elem, validate, instanceOption, validateOption) {
	var vObj = new Validation(elem, instanceOption)
	vObj.add(validate, validateOption)
	return vObj
}

Validation.prototype = {
	validClass: 'ZV_valid',
	invalidClass: 'ZV_invalid',
	messageClass: 'ZV_validation_msg',
	validFieldClass: 'ZV_valid_field',
	invalidFieldClass: 'ZV_invalid_field',
	initialize: function(option) {
		var element = this.element
		this.validations = []
		this.elemType = this.getType()
		this.form = element.form

		// options
		var option = option || {}
		this.validMsg = option.validMsg || element.getAttribute('data-validate-succ') || '填写正确'
		var node = option.insertAfterWhatNode || element
		this.insertAfterWhatNode = node.nodeType ? node : $(node)
		this.onlyOnBlur = option.onlyOnBlur || false
		this.wait = option.wait || 0
		this.onlyOnSubmit = option.onlyOnSubmit || false
		
		// hooks
		this.beforeValidate = option.beforeValidate || noop
		this.beforeValid    = option.beforeValid || noop
		this.onValid = option.onValid || function() {
			this.insertMessage(this.createMessage())
			this.addFieldClass()
		}
		this.afterValid    = option.afterValid || noop
		this.beforeInvalid = option.beforeInvalid || noop
		this.onInvalid = option.onInvalid || function() {
			this.insertMessage(this.createMessage())
			this.addFieldClass()
		}
		this.afterInvalid  = option.afterInvalid || noop
		this.afterValidate = option.afterValidate || noop
		
		// add to form if it has been provided
		if (this.form) {
			this.formObj = ValidationForm.getInstance(this.form)
			this.formObj.addField(this)
		}

		// collect old events
		this.oldOnFocus  = element.onfocus  || noop
		this.oldOnBlur   = element.onblur   || noop
		this.oldOnClick  = element.onclick  || noop
		this.oldOnChange = element.onchange || noop
		this.oldOnKeyup  = element.onkeyup  || noop
		
		var self = this
		element.onfocus = function(e) {
			self.doOnFocus(e)
			return self.oldOnFocus.call(this, e)
		}
		
		if (this.onlyOnSubmit) return
		
		switch (this.elemType) {
			case TYPE.checkbox:
				element.onclick = function(e) {
					self.validate()
					return self.oldOnClick.call(this, e)
				}
			case TYPE.select:
			case TYPE.file:
				element.onchange = function(e) {
					self.validate()
					return self.oldOnChange.call(this, e)
				}
				break;
			default:
				if (!this.onlyOnBlur) {
					element.onkeyup = function(e) {
						self.deferValidation()
						return self.oldOnKeyup.call(this, e)
					}
				}
				element.onblur = function(e) {
					self.doOnBlur(e)
					return self.oldOnBlur.call(this, e)
				}
		}
	},
	destroy: function() {
		if (this.formObj) {
			// remove the field from the ValidationForm
			this.formObj.removeField(this)
			// destroy the ValidationForm if no Validation fields left in it
			this.formObj.destroy()
		}
		// remove events - set them back to the previous events
		this.element.onfocus = this.oldOnFocus
		if (!this.onlyOnSubmit) {
			switch (this.elemType) {
				case TYPE.checkbox:
					this.element.onclick = this.oldOnClick
				// let it run into the next to add a change event too
				case TYPE.select:
				case TYPE.file:
					this.element.onchange = this.oldOnChange
					break
				default:
					if (!this.onlyOnBlur) {
						this.element.onkeyup = this.oldOnKeyup
					}
					this.element.onblur = this.oldOnBlur
			}
		}
		this.validations = []
		this.removeMessageAndFieldClass()
	},
	add: function(op, option) {
		var self = this
		option = option || {}
		if (!option.failureMsg) {
			option.failureMsg = self.element.getAttribute('data-validate-err')
		}
		if ( Util.isString(op) ) {
			forEach(op.split(' '), function(n, i) {
				self.validations[i] = {
					validateFunc: Validate[n],
					params: option
				}
			})
		}
		return self
	},
	remove: function(func, option) {
		var validations = this.validations
		var victimless = []
		forEach(validations, function(obj) {
			if (obj.type != func && obj.params != option) {
				victimless.push(obj)
			}
		})
		this.validations = victimless
		return this
	},
	deferValidation: function(e) {
		var self = this
		if (this.wait >= 300) this.removeMessageAndFieldClass()
		if (this.timeout) clearTimeout(self.timeout)
		this.timeout = setTimeout(function(){ self.validate()}, self.wait)
	},
	doOnBlur: function(e) {
		this.focused = false
		this.validate(e)
	},
	doOnFocus: function(e) {
		this.focused = true
		this.removeMessageAndFieldClass()
	},
	getType: function() {
		var element = this.element
		var ntype = element.type.toUpperCase()
		var nname = element.nodeName.toUpperCase()
		switch (true) {
			case (nname == 'TEXTAREA'):
				return TYPE.textarea
			case (nname == 'INPUT' && ntype == 'TEXT'):
				return TYPE.text
			case (nname == 'INPUT' && ntype == 'PASSWORD'):
				return TYPE.password
			case (nname == 'INPUT' && ntype == 'CHECKBOX'):
				return TYPE.checkbox
			case (nname == 'INPUT' && ntype == 'FILE'):
				return TYPE.file
			case (nname == 'SELECT'):
				return TYPE.select
			case (nname == 'INPUT'):
				throw new Error('Cannot use Validation on an ' + ntype.toLowerCase() + ' input')
			default:
				throw new Error('Element must be an input/select/textarea - ' + nname.toLowerCase() + ' was given')
		}
	},
	doValidations: function() {
		var validations = this.validations
		var length = validations.length
		this.validateFailed = false
		for (var i = 0; i < length; ++i) {
			var vs = validations[i]
			this.validateFailed = !this.perform(vs.validateFunc, vs.params)
			if (this.validateFailed) {
				return false
			} 
		}
		this.message = this.validMsg
		return true
	},
	perform: function(func, option) {
		// check whether we should display the message when empty
		switch (func) {
			case Validate.presence:
			case Validate.confirmation:
			case Validate.acceptance:
				this.showMessageWhenEmpty = true
				break;
			case Validate.custom:
				if (option.showMessageWhenEmpty) {
					this.showMessageWhenEmpty = true
				}
				break;
		}
		// select and checkbox elements values are handled differently
		var element = this.element
		var elType  = this.elemType 
		var val = (elType === TYPE.select) ? element.options[element.selectedIndex].value : element.value
		if (func == Validate.acceptance) {
			if (elType != TYPE.checkbox) {
				throw new Error('Element to validate acceptance must be a checkbox')
			}
			val = element.checked
		}
		// now validate
		var isValid = true
		try {
			func(val, option)
		} catch(error) {
			if (error instanceof ZVError) {
				if (val !== '' || (val === '' && this.showMessageWhenEmpty)) {
					this.validateFailed = true
					// Opera 10 adds stacktrace after newline
					this.message = error.message.split('\n')[0]
					isValid = false
				}
			} else {
				throw error
			}
		} finally {
			return isValid
		}
	},
	validate: function(e) {
		if (this.element.disabled) return true
		this.beforeValidate()
		var isValid = this.doValidations()
		if (isValid) {
			this.beforeValid()
			this.onValid()
			this.afterValid()
			return true
		} else {
			this.beforeInvalid()
			this.onInvalid()
			this.afterInvalid()
			return false
		}
		this.afterValidate()
	},
	enable: function() {
		this.element.disabled = false
		return this
	},
	disable: function() {
		this.element.disabled = true
		this.removeMessageAndFieldClass()
		return this
	},
	createMessage: function() {
		var span = doc.createElement('span')
		var textNode = doc.createTextNode(this.message)
		span.appendChild(textNode)
		return span
	},
	insertMessage: function(elem) {
		this.removeMessage()
		// dont insert anything if vaalidMesssage has been set to false or empty string
		if (!this.validateFailed && !this.validMsg) {
			return
		}
		var val = this.element.value
		var whatNode = this.insertAfterWhatNode
		if ( (this.showMessageWhenEmpty && (this.elemType === TYPE.checkbox || val === '')) || val !== '' ) {
			var className = this.validateFailed ? this.invalidClass : this.validClass
			elem.className += ' ' + this.messageClass + ' ' + className;
			var parent = whatNode.parentNode
			if (whatNode.nextSibling) {
				parent.insertBefore(elem, whatNode.nextSibling)
			} else {
				parent.appendChild(elem)
			}
		}
	},
	addFieldClass: function() {
		var element = this.element
		var validCls = this.validFieldClass
		var invalidCls = this.invalidFieldClass
		
		this.removeFieldClass()
		if (!this.validateFailed) {
			if (this.showMessageWhenEmpty || element.value !== '') {
				if (element.className.indexOf(validCls) === -1) {
					element.className += ' ' + validCls
				}
			}
		} else {
			if (element.className.indexOf(invalidCls) === -1) {
				element.className += ' ' + invalidCls
			}
		}
	},
	removeMessage: function() {
		var nextEl
		var el = this.insertAfterWhatNode
		while (el.nextSibling) {
			if (el.nextSibling.nodeType === 1) {
				nextEl = el.nextSibling
				break
			}
			el = el.nextSibling
		}
		if (nextEl && nextEl.className.indexOf(this.messageClass) != -1) {
			this.insertAfterWhatNode.parentNode.removeChild(nextEl)
		}
	},
	removeFieldClass: function() {
		var cls = this.element.className
		if (cls.indexOf(this.invalidFieldClass) !== -1) {
			this.element.className = cls.split(this.invalidFieldClass).join('')
		}
		if (cls.indexOf(this.validFieldClass) !== -1) {
			this.element.className = cls.split(this.validFieldClass).join(' ')
		}
	},
	removeMessageAndFieldClass: function() {
		this.removeMessage()
		this.removeFieldClass()
	}
};

// exports Util to Validation
Validation.Util = Util


// Universally Unique Identifie
var uuid = 1
// cache all instance
var formInstance = {}

function ValidationForm(elem) {
	this.initialize(elem)
}
ValidationForm.getInstance = function(elem) {
	if (!elem) return
	var el = elem.nodeName ? elem : $(elem)
	if (!el.id) {
		el.id = 'formId_' + uuid++
	}
	if (!formInstance[el.id]) {
		formInstance[el.id] = new ValidationForm(el)
	}
	return formInstance[el.id]
}
ValidationForm.prototype = {
	beforeValidate: noop,
	onValid:        noop,
	onInvalid:      noop,
	afterValidate:  noop,
	initialize: function(elem) {
		this.name = elem.id
		this.element = elem
		this.fields = []
		// preserve the old onsubmit event
		this.oldOnSubmit = this.element.onsubmit || noop
		var self = this
		this.element.onsubmit = function(e) {
			var ret = false
			self.beforeValidate()
			self.valid = self.execValidate(self.fields)
			self.valid ? self.onValid() : self.onInvalid()
			self.afterValidate()
			if (self.valid) {
				ret = self.oldOnSubmit.call(this, e || win.event) !== false
			}
			if (!ret) return ret
		}
	},
	addField: function(field) {
		this.fields.push(field)
	},
	removeField: function(victim) {
		var victimless = []
		var fields = this.fields
		forEach(fields, function(field) {
			if (field !== victim) victimless.push(field)
		})
		this.fields = victimless
	},
	execValidate: function() {
		var returnValue = true
		forEach(this.fields, function(obj) {
			var valid = obj.validate()
			if (returnValue) returnValue = valid
		})
		return returnValue
	},
	destroy: function(force) {
		// only destroy if has no fields and not being forced
		if (this.fields.length != 0 && !force) return false
		// remove events - set back to previous events
		this.element.onsubmit = this.oldOnSubmit
		// remove from the instances namespace
		formInstance[this.name] = null
		return true
	}
};

// Expose Validation to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
	define('Validation', [], function() { return Validation } )
} else {
	win.Validation = Validation
}

}(this, document);

/**
 * JavaScript Selector
 * Copyright (c) 2010 snandy
 * Blog: http://snandy.cnglogs.com
 * QQ群: 34580561
 * 
 * $ 获取元素, 在DOM中使用频繁的，根据2/8原则只实现最常用的四种
 * 
 * @param {Object} selector
 * @param {Object} context
 * 
 * 1, 通过id获取,该元素是唯一的
 *	   $('#id')
 * 
 * 2, 通过className获取
 *	$('.cls') 获取文档中所有className为cls的元素
 *	$('.cls', el)
 *	$('.cls', '#id')
 *	$('span.cls') 获取文档中所有className为cls的span元素
 *	$('span.cls', el) 获取指定元素中className为cls的元素, el为HTMLElement (不推荐)
 *	$('span.cls', '#id') 获取指定id的元素中className为cls的元素
 *	
 * 3, 通过tagName获取
 *	$('span') 获取文档中所有的span元素
 *	$('span', el) 获取指定元素中的span元素, el为HTMLElement (不推荐)
 *	$('span', '#id') 获取指定id的元素中的span元素
 * 
 * 4, 通过attribute获取
 *	$('[name]') 获取文档中具有属性name的元素
 *	$('[name]', el)
 *	$('[name]', '#id')
 *	$('[name=uname]') 获取文档中所有属性name=uname的元素
 *	$('[name=uname]', el)
 *	$('[name=uname]', '#id')
 *	$('input[name=uname]') 获取文档中所有属性name=uname的input元素
 *	$('input[name=uname]', el)
 *	$('input[name=uname]', '#id')
 */
var query = function(win, doc, undefined) {
	
	// Save a reference to core methods
	var slice = Array.prototype.slice
	
	// selector regular expression
	var rId = /^#[\w\-]+/
	var	rTag = /^([\w\*]+)$/
	var	rCls = /^([\w\-]+)?\.([\w\-]+)/
	var	rAttr = /^([\w]+)?\[([\w]+-?[\w]+?)(=(\w+))?\]/
	
	// For IE9/Firefox/Safari/Chrome/Opera
	var makeArray = function(obj) {
		return slice.call(obj, 0)
	}
	// For IE6/7/8
	try{
		slice.call(doc.documentElement.childNodes, 0)[0].nodeType
	} catch(e) {
		makeArray = function(obj) {
			var result = []
			for (var i = 0, len = obj.length; i < len; i++) {
				result[i] = obj[i]
			}
			return result
		}
	}
	
	function byId(id) {
		return doc.getElementById(id)
	}
	function check(attr, val, node) {
		var reg = RegExp('(?:^|\\s+)' + val + '(?:\\s+|$)')
		var	attribute = attr === 'className' ? 
				node.className : node.getAttribute(attr)
		if (attribute) {
			if (val) {
				if (reg.test(attribute)) return true
			} else {
				return true
			}
		}
		return false
	}	
	function filter(all, attr, val) {
		var el, result = []
		var	i = 0, r = 0
		while ( (el = all[i++]) ) {
			if ( check(attr, val, el) ) {
				result[r++] = el
			}
		}
		return result
	}
		
	function query(selector, context) {
		var s = selector, arr = []
		var context = context === undefined ? doc : typeof context === 'string' ?
				byId(context.substr(1, context.length)) : context
		
		// id 还是用docuemnt.getElementById最快
		if ( rId.test(s) ) {
			arr[0] = byId( s.substr(1, s.length) )
			return arr
		}
		// 优先使用querySelector，现代浏览器都实现它了
		if (context.querySelectorAll) {
			if (context.nodeType === 1) {
				var old = context.id, id = context.id = '__ZZ__'
				try {
					return context.querySelectorAll('#' + id + ' ' + s)
				} catch(e){
					throw new Error('querySelectorAll: ' + e)
				} finally {
					old ? context.id = old : context.removeAttribute('id')
				}
			}
			return makeArray(context.querySelectorAll(s))
		}
		// className
		if ( rCls.test(s) ) {
			var ary = s.split('.')
			var	tag = ary[0] 
			var	cls = ary[1]
			if (context.getElementsByClassName) {
				var elems = context.getElementsByClassName(cls)
				if (tag) {
					for (var i = 0, len = elems.length; i < len; i++) {
						var el = elems[i]
						el.tagName.toLowerCase() === tag && arr.push(el)
					}
					return arr
				} else {
					return makeArray(elems)
				}
			} else {
				var all = context.getElementsByTagName(tag || '*')
				return filter(all, 'className', cls)
			}
		}
		// Tag name
		if ( rTag.test(s) ) {
			return makeArray(context.getElementsByTagName(s))
		}
		// Attribute
		if ( rAttr.test(s) ) {
			var result = rAttr.exec(s)
			var all = context.getElementsByTagName(result[1] || '*')
			return filter(all, result[2], result[4])
		}
	}
	
	return query
}(this, document);

/*
 * 自执行验证，通过element上的data-validate属性
 * 
 */~function(Validation) {
	var Util = Validation.Util
	var elems = query('[data-validate]')
	Util.forEach(elems, function(elem) {
		var vali = new Validation(elem)
		vali.add(elem.getAttribute('data-validate'))
	})
}(Validation);

