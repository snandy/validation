/*!
 * Validation.js v0.1.0
 * http://snandy.github.io/validation
 * Original idea: www.livevalidation.com (Copyright 2007-2010 Alec Hill)
 * @snandy 2013-10-02 16:04:14
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
    return win.jQuery ? win.jQuery(selector) : query(selector)
}
function single(selector) {
    return $(selector)[0]
}
Util.$ = $

// Error class
function ZVError(errorMsg) {
    this.message = errorMsg
    this.name = 'ValidationError'
}
/**
 *  Validate 单例， 核心验证函数库， 可脱离Validation单独使用
 *   
 */
var Validate = {
    /**
     * 验证是否存在 ，必填项
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示语
     */
    presence: function(val, option) {
        var option = option || {}
        var msg = option.failureMsg || '不能为空!'
        if (val === '' || val === null || val === undefined) {
            Validate.fail(msg)
        }
        return true
    },
    /**
     * 数字验证
     * @param {Object} val
     * @param {Object} option
     *      is  {Number}             特定数
     *      min {Number}             指定最小约束数
     *      max {Number}             指定最大约束数
     *      onlyInteger {Bool}       是否仅为整数
     *      notANumberMsg {String}   非数字提示语
     *      notAnIntegerMsg {String} 非整数提示语
     *      wrongNumberMsg {String}  非特定数提示语
     *      tooLowMsg {String}       太小提示语
     *      tooHighMsg {String}      太大提示语
     */
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
    /**
     * 格式化验证
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示语
     *      pattern {RegExp} 正则
     *      negate {Bool} 
     */
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
    /**
     * email验证
     * @param {Object} val
     * @param {Object} option
     *      faliureMsg {Stirng} 错误提示
     *      pattern {RegExp} 
     */
    email: function(val, option) {
        var option = option || {}
        var reg = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i
        var message = option.failureMsg || '必须为一个有效的电子邮箱地址!'
        Validate.format(val, {failureMsg: message, pattern: reg})
        return true
    },
    /**
     * 长度验证
     * @param {Object} val
     * @param {Object} option
     *      is {Number}  指定长度
     *      min {Number} 低限
     *      max {Number} 高限
     *      wrongSizeMsg {String} 指定长度错误提示
     *      tooShortMsg {String} 低限错误提示
     *      tooLongMsg {String} 高限错误提示
     */
    size: function(val, option) {
        var val = String(val)
        var option = option || {}
        var min = ((option.min) || (option.min == 0)) ? option.min : null
        var max = ((option.max) || (option.max == 0)) ? option.max : null
        var is  = ((option.is)  || (option.is == 0))  ? option.is  : null
        var wrongSizeMsg = option.wrongSizeMsg || '必须是' + is + '个字符长度!'
        var tooShortMsg    = option.tooShortMsg || '不能小于' + min + '个字符长度!'
        var tooLongMsg     = option.tooLongMsg || '不能大于' + max + '个字符长度!'
        switch (true) {
            case (is !== null):
                if ( val.length != Number(is) ) Validate.fail(wrongSizeMsg)
                break
            case (min !== null && max !== null):
                Validate.size(val, {tooShortMsg: tooShortMsg, min: min})
                Validate.size(val, {tooLongMsg: tooLongMsg, max: max})
                break
            case (min !== null):
                if ( val.length < Number(min) ) Validate.fail(tooShortMsg)
                break
            case (max !== null):
                if ( val.length > Number(max) ) Validate.fail(tooLongMsg)
                break
            default:
                throw new Error('Validate::size - size(s) to validate against must be provided!')
        }
        return true
    },
    /**
     * 包含校验
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示
     */
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
        forEach(within, function(it) {
            if (it === val) found = true
            if (option.partialMatch && val.indexOf(it) !== -1) found = true
        })
        if ( (!option.negate && !found) || (option.negate && found) ) {
            Validate.fail(message)
        }
        return true
    },
    /**
     * 排除校验
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示
     */
    exclusion: function(val, option) {
        var option = option || {}
        option.failureMsg = option.failureMsg || '不能输入列表中的元素!'
        option.negate = true
        Validate.inclusion(val, option)
        return true
    },
    /**
     * 中文校验
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示
     */
    chinese: function(val, option) {
        var option = option || {}
        var msg = option.failureMsg || '请输入中文!'
        var reg = /^[\u4E00-\u9FA5]+$/
        if (!reg.test(val)) {
            Validate.fail(msg)
        }
        return true
    },
    /**
     * 手机号校验
     * @param {Object} val
     * @param {Object} option
     *      failureMsg {String} 错误提示
     */    
    mobile: function(val, option) {
        var option = option || {}
        var msg = option.failureMsg || '请输入正确的手机号!'

        // 必须为11位
        var leng = val.length === 11

        // 验证正则
        var reg = /^1(?:[38]\d|4[57]|5[01256789])\d{8}$/
        if (!reg.test(val)) {
            Validate.fail(msg)
        }
        return true
    },
    confirmation: function(val, option) {
        if (!option.match) {
            throw new Error('Error validating confirmation: Id of element to match must be provided')
        }
        var option = option || {}
        var message = option.failureMsg || '两次输入不一致!'
        var match = option.match.nodeName ? option.match : single(option.match)
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
    /**
     * 自定义验证规则
     * @param {Object} val
     * @param {Object} option
     */
    custom: function(val, option) {
        var option = option || {}
        var against = option.against || function(){ return true }
        var args = option.args || {}
        var message = option.failureMsg || 'Not valid!'
        if (!against(val, args)) {
            Validate.fail(message)
        }
        return true
    },
    fail: function(errorMsg) {
        throw new ZVError(errorMsg)
    }
};

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


// Universally Unique Identifie
var uuid = 1
// cache all instance
var formInstance = {}

/**
 * ValidationForm Class 私有类，仅供Validation内部使用 
 * @param {Object} elem
 */
function ValidationForm(elem) {
    this.initialize(elem)
}
ValidationForm.getInstance = function(elem) {
    if (!elem) return
    var el = elem.nodeName ? elem : single(elem)
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
/*
 * 自执行验证，通过element上的Script的data-run="true"
 * 
 */
~function() {
    var oldOnload = win.onload
    win.onload = function() {
        var canRun = single('script[data-run=true]')
        if (!canRun) return
        var selector = canRun.getAttribute('data-container')
        var container = $(selector)
        Validation.init(container)
        if (oldOnload) oldOnload.call(win)
    }
}()


// Expose Validation to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
	define('Validation', [], function() { return Validation } )
} else {
	win.Validation = Validation
}

}(this, document);
