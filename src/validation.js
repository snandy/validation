
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
