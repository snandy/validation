/**
 *  Validation Class 公开类
 * 
 * @param {Object} elem [id or css selector(jQuery support)]
 * @param {Object} option
 * 
 *     option properties: 
 *      validMsg {String}             正确的提示消息 ,如果没传，将从输入域的data-validate-succ取  (默认 "填写正确")
 *      insertAfterWhatNode {Element} 提示信息插入的位置，如果该元素存在在插入它后面 (默认插在输入域的后面)
 *      onlyBlur {Bool}               是否仅在光标离验证 (默认false)
 *      onlyOnSubmit {Bool}           是否仅在Form提交时验证
 *      wait {int}                    延迟验证的时间 (默认0)
 *      
 *      beforeValidate {Function}     验证前的回调函数 (默认 noop)
 *      beforeValid {Function}        验证正确时执行，在onValid前 
 *      onValid {Function}            验证正确函数，此函数将覆盖默认处理函数，你必须实现将正确提示消息展现到UI
 *      afterValid {Function}         验证正确时执行，在onValid后
 * 
 *      beforeInValid {Function}      验证失败时执行，在onInValid前
 *      onInValid {Function}          验证失败函数，此函数将覆盖默认处理函数，你必须实现将失败提示消息展现到UI
 *      afterInValid {Function}       验证失败时执行，在onValid后
 *      afterValidate {Function}      验证前的回调函数 (默认 noop)
 * 
 */
function Validation(elem, option) {
    if (!elem) return
    this.element = elem.nodeName ? elem : single(elem)
    if (!this.element) throw new Error('element is not exits')
    this.initialize(option)
}
/**
 * convenience method to add validation 
 * @param {Object} elem
 * @param {Object} validate
 * @param {Object} instanceOption
 * @param {Object} validateOption
 */
Validation.add = function(elem, validate, instanceOption, validateOption) {
    var vObj = new Validation(elem, instanceOption)
    vObj.add(validate, validateOption)
    return vObj
}
/**
 * 根据输入域的data-validate进行初始化，只需添加data-validate属性就自动完成验证，无需写一行JS代码
 * @param {DOM Element} container
 */
Validation.init = function(container) {
	var elems = $('[data-validate]', container)
	Util.forEach(elems, function(elem) {
		var vali = new Validation(elem)
		vali.add(elem.getAttribute('data-validate'))
	})
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
        this.validMsg = option.validMsg || 
                element.getAttribute('data-validate-succ') || '填写正确'
        var node = option.insertAfterWhatNode || element
        this.insertAfterWhatNode = node.nodeType ? node : single(node)
        this.onlyOnBlur = option.onlyOnBlur || false
        this.wait = option.wait || 0
        this.onlyOnSubmit = option.onlyOnSubmit || false
        
        // events
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
                self.validations.push({
                    validateFunc: Validate[n],
                    params: option
                })
            })
        }
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
