/*!
 * validation.js v0.1.0
 * http://snandy.github.io/validation
 * @snandy 2013-06-16 18:06:47
 *
 */
~function(win, doc, undefined) {

var toString = Object.prototype.toString
var Util = {}

// Iterator
function forEach(obj, iterator, context) {
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
}

function Validation(elem, option) {
	if (!elem) return
	this.element = elem.nodeName ? elem : $(elem)
	if (!this.element) throw new Error('element is not exits')
	this.initialize(elem, option)
}
Validation.massValidate = function(validations) {
	var returnValue = true
	forEach(validations, function(obj) {
		var valid = obj.validate()
		if (returnValue) returnValue = valid
	})
	return returnValue
}
Validation.prototype = {
	validClass: 'ZV_valid',
	invalidClass: 'ZV_invalid',
	messageClass: 'ZV_validation_msg',
	validFieldClass: 'ZV_valid_field',
	invalidFieldClass: 'ZV_invalid_field',
	initialize: function(elem, option) {
		// default properties that could not be initialised above
		this.validations = []
		this.elementType = this.getType()
		this.form = this.element.form

		// options
		var option = option || {}
		this.validMsg = option.validMsg || 'OK'
		var node = option.insertAfterWhatNode || this.element
		this.insertAfterWhatNode = node.nodeType ? node : $(node)
		this.onlyOnBlur = option.onlyOnBlur || false
		this.wait = option.wait || 0
		this.onlyOnSubmit = option.onlyOnSubmit || false
		
		// hooks
		this.beforeValidate = option.beforeValidate || noop
		this.beforeValid = option.beforeValid || noop
		this.onValid = option.onValid || function() {
			this.insertMessage(this.createMessage())
			this.addFieldClass()
		}
		this.afterValid = option.afterValid || noop
		this.beforeInvalid = option.beforeInvalid || noop
		this.onInvalid = option.onInvalid || function() {
			this.insertMessage(this.createMessage())
			this.addFieldClass()
		}
		this.afterInvalid = option.afterInvalid || noop
		this.afterValidate = option.afterValidate || noop
		
		// add to form if it has been provided
		if (this.form) {
			this.formObj = ValidationForm.getInstance(this.form)
			this.formObj.addField(this)
		}

		// collect old events
		this.oldOnFocus  = this.element.onfocus  || noop
		this.oldOnBlur   = this.element.onblur   || noop
		this.oldOnClick  = this.element.onclick  || noop
		this.oldOnChange = this.element.onchange || noop
		this.oldOnKeyup  = this.element.onkeyup  || noop
		
		var self = this
		this.element.onfocus = function(e) {
			self.doOnFocus(e)
			return self.oldOnFocus.call(this, e)
		}
		
		if (this.onlyOnSubmit) return
		
		switch (this.elementType) {
			case TYPE.checkbox:
				this.element.onclick = function(e) {
					self.validate()
					return self.oldOnClick.call(this, e)
				}
			case TYPE.select:
			case TYPE.file:
				this.element.onchange = function(e) {
					self.validate()
					return self.oldOnChange.call(this, e)
				}
				break;
			default:
				if (!this.onlyOnBlur) {
					this.element.onkeyup = function(e) {
						self.deferValidation()
						return self.oldOnKeyup.call(this, e)
					}
				}
				this.element.onblur = function(e) {
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
			switch (this.elementType) {
				case TYPE.checkbox:
					this.element.onclick = this.oldOnClick
				// let it run into the next to add a change event too
				case TYPE.select:
				case TYPE.file:
					this.element.onchange = this.oldOnChange
					break;
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
		if (this.wait >= 300) {
			this.removeMessageAndFieldClass();
		}
		var self = this
		if (this.timeout) {
			clearTimeout(self.timeout)
		}
		this.timeout = setTimeout(function(){ 
			self.validate()
		}, self.wait)
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
				return TYPE.textarea;
			case (nname == 'INPUT' && ntype == 'TEXT'):
				return TYPE.text;
			case (nname == 'INPUT' && ntype == 'PASSWORD'):
				return TYPE.password;
			case (nname == 'INPUT' && ntype == 'CHECKBOX'):
				return TYPE.checkbox;
			case (nname == 'INPUT' && ntype == 'FILE'):
				return TYPE.file;
			case (nname == 'SELECT'):
				return TYPE.select;
			case (nname == 'INPUT'):
				throw new Error('Cannot use Validation on an ' + ntype.toLowerCase() + ' input');
			default:
				throw new Error('Element must be an input, select, or textarea - ' + nname.toLowerCase() + ' was given');
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
		var elemType = this.elementType 
		var val = (elemType === TYPE.select) ? element.options[element.selectedIndex].value : element.value
		if (func == Validate.acceptance) {
			if (elemType != TYPE.checkbox) {
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
		if ( (this.showMessageWhenEmpty && (this.elementType === TYPE.checkbox || val === '')) || val !== '' ) {
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
			if (this.showMessageWhenEmpty || element.value != '') {
				if (element.className.indexOf(validCls) == -1) {
					element.className += ' ' + validCls
				}
			}
		} else {
			if (element.className.indexOf(invalidCls) == -1) {
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
				break;
			}
			el = el.nextSibling
		}
		if (nextEl && nextEl.className.indexOf(this.messageClass) != -1) {
			this.insertAfterWhatNode.parentNode.removeChild(nextEl)
		}
	},
	removeFieldClass: function() {
		var cls = this.element.className
		if (cls.indexOf(this.invalidFieldClass) != -1) {
			this.element.className = cls.split(this.invalidFieldClass).join('')
		}
		if (cls.indexOf(this.validFieldClass) != -1) {
			this.element.className = cls.split(this.validFieldClass).join(' ')
		}
	},
	removeMessageAndFieldClass: function() {
		this.removeMessage()
		this.removeFieldClass()
	}
}


function ValidationForm(elem) {
	this.initialize(elem)
}
ValidationForm.instances = {}
ValidationForm.getInstance = function(elem) {
	if (!elem) return
	var el = elem.nodeName ? elem : $(elem)
	var rand = Math.random() * Math.random()
	if (!el.id) {
		el.id = 'formId_' + rand.toString().replace(/\./, '') + new Date().valueOf()
	}
	if (!ValidationForm.instances[el.id]) {
		ValidationForm.instances[el.id] = new ValidationForm(el)
	}
	return ValidationForm.instances[el.id]
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
			self.valid = Validation.massValidate(self.fields)
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
	destroy: function(force) {
		// only destroy if has no fields and not being forced
		if (this.fields.length != 0 && !force) return false
		// remove events - set back to previous events
		this.element.onsubmit = this.oldOnSubmit
		// remove from the instances namespace
		ValidationForm.instances[this.name] = null
		return true
	}
}

// Expose Validation to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
	define('Validation', [], function() { return Validation } )
} else {
	win.Validation = Validation
}

}(this, document);
