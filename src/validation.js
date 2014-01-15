/**
 *  Validation Class 公开类
 * 
 * @param {Object} elem [id or css selector(jQuery support)]
 * @param {Object} option
 * 
 *   option properties: 
 *      succMsg {String}            正确的提示消息 ,如果没传，将从输入域的data-vali-succmsg取  (默认 "填写正确")
 *      afterWhatNode {Element}     提示信息插入的位置，如果该元素存在在插入它后面 (默认插在输入域的后面)
 *      onlyOnBlur {Bool}             是否仅在光标离验证 (默认false)
 *      onlyOnSubmit {Bool}         是否仅在Form提交时验证
 *      wait {int}                  延迟验证的时间 (默认0)
 *      
 *      beforeValidate {Function}   验证前的回调函数 (默认 noop)
 *      beforeSucc {Function}       验证正确时执行，在onValid前 
 *      onSucc {Function}           验证正确函数，此函数将覆盖默认处理函数，你必须实现将正确提示消息展现到UI
 *      afterSucc {Function}        验证正确时执行，在onValid后
 * 
 *      beforeFail {Function}       验证失败时执行，在onInValid前
 *      onFail {Function}           验证失败函数，此函数将覆盖默认处理函数，你必须实现将失败提示消息展现到UI
 *      afterFail {Function}        验证失败时执行，在onValid后
 *      afterValidate {Function}    验证前的回调函数 (默认 noop)
 * 
 */
function Validation(elem, option) {
    if (!elem) return
    this.elem = elem.nodeName ? elem : single(elem)
    if (!this.elem) throw new Error('element is not exits')
    this.initialize(option)
}

var validClass = 'zv_valid'
var invalidClass = 'zv_invalid'
var messageClass = 'zv_vali_msg'
var fieldSuccClass = 'zv_succ_field'
var fieldFailClass = 'zv_fail_field'

/**
 * 获取被验证元素的类型
 */
function getType(elem) {
    var ntype = elem.type.toUpperCase()
    var nname = elem.nodeName.toUpperCase()
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
}

/**
 * 创建提示信息，默认是span元素
 */
function createMessage(tag, msg) {
    var span = doc.createElement(tag || 'span')
    var textNode = doc.createTextNode(msg)
    span.appendChild(textNode)
    return span
}

Validation.prototype = {
    initialize: function(option) {
        var elem = this.elem
        this.validations = []
        this.elemType = getType(elem)
        this.form = elem.form

        // options
        var option = option || {}

        // 验证正确的提示语
        this.succMsg = option.succMsg || elem.getAttribute('data-succ-msg') || '填写正确'

        // 提示语插入在哪个元素后面，可以是dom元素或css选择器
        var node = option.afterWhatNode || elem
        this.afterWhatNode = node.nodeType ? node : single(node)

        // 是否仅在鼠标离开时验证，默认否
        this.onlyOnBlur = option.onlyOnBlur || false
        
        // 是否仅在form提交的时候验证，默认否
        this.onlyOnSubmit = option.onlyOnSubmit || false

        // 延迟验证的设定
        this.wait = option.wait || 0
        
        // events 验证前、验证后、验证中

        // 验证前
        this.beforeValidate = option.beforeValidate || noop

        // 验证通过
        this.beforeSucc = option.beforeSucc || noop
        this.onSucc = option.onSucc || function() {
            this.insertMessage(createMessage('', this.message))
            this.addFieldClass()
        }
        this.afterSucc = option.afterSucc || noop

        // 验证不通过
        this.beforeFail = option.beforeFail || noop
        this.onFail = option.onFail || function() {
            this.insertMessage(createMessage('', this.message))
            this.addFieldClass()
        }
        this.afterFail  = option.afterFail || noop

        // 验证后
        this.afterValidate = option.afterValidate || noop
        
        // add to form if it has been provided
        if (this.form) {
            this.formObj = ValidationForm.getInstance(this.form)
            this.formObj.addField(this)
        }

        // 暂存旧事件hander
        this.oldOnFocus  = elem.onfocus  || noop
        this.oldOnBlur   = elem.onblur   || noop
        this.oldOnClick  = elem.onclick  || noop
        this.oldOnChange = elem.onchange || noop
        this.oldOnKeyup  = elem.onkeyup  || noop
        
        var self = this
        elem.onfocus = function(e) {
            self.removeMessageAndFieldClass()
            return self.oldOnFocus.call(this, e)
        }
        
        // 仅在form submit时验证
        if (this.onlyOnSubmit) return

        switch (this.elemType) {
            case TYPE.checkbox:
                elem.onclick = function(e) {
                    self.validate()
                    return self.oldOnClick.call(this, e)
                }
            case TYPE.select:
            case TYPE.file:
                elem.onchange = function(e) {
                    self.validate()
                    return self.oldOnChange.call(this, e)
                }
                break; 
            default:
                if (!this.onlyOnBlur) {
                    elem.onkeyup = function(e) {
                        self.deferValidation()
                        return self.oldOnKeyup.call(this, e)
                    }
                }
                elem.onblur = function(e) {
                    self.validate(e)
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
        this.elem.onfocus = this.oldOnFocus
        if (!this.onlyOnSubmit) {
            switch (this.elemType) {
                case TYPE.checkbox:
                    this.elem.onclick = this.oldOnClick
                // let it run into the next to add a change event too
                case TYPE.select:
                case TYPE.file:
                    this.elem.onchange = this.oldOnChange
                    break
                default:
                    if (!this.onlyOnBlur) {
                        this.elem.onkeyup = this.oldOnKeyup
                    }
                    this.elem.onblur = this.oldOnBlur
            }
        }
        this.validations = []
        this.removeMessageAndFieldClass()
    },
    add: function(op, option) {
        var self = this
        option = option || {}
        if (!option.failureMsg) {
            option.failureMsg = self.elem.getAttribute('data-error-msg')
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
        if (self.wait >= 300) self.removeMessageAndFieldClass()
        if (self.timeout) clearTimeout(self.timeout)
        self.timeout = setTimeout(function() {
            self.validate()
        }, self.wait)
    },
    doValidation: function() {
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
        this.message = this.succMsg
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
        var elem = this.elem
        var elType  = this.elemType 
        var val = (elType === TYPE.select) ? elem.options[elem.selectedIndex].value : elem.value
        if (func == Validate.acceptance) {
            if (elType != TYPE.checkbox) {
                throw new Error('Element to validate acceptance must be a checkbox')
            }
            val = elem.checked
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
        if (this.elem.disabled) return true
        this.beforeValidate()
        var isValid = this.doValidation()
        if (isValid) {
            this.beforeSucc()
            this.onSucc()
            this.afterSucc()
        } else {
            this.beforeFail()
            this.onFail()
            this.afterFail()
        }
        this.afterValidate()
        return isValid
    },
    insertMessage: function(elem) {
        this.removeMessage()

        // dont insert anything if vaalidMesssage has been set to false or empty string
        if (!this.validateFailed && !this.succMsg) return
        
        var val = this.elem.value
        var whatNode = this.afterWhatNode
        if ( (this.showMessageWhenEmpty && (this.elemType === TYPE.checkbox || val === '')) || val !== '' ) {
            var className = this.validateFailed ? invalidClass : validClass
            elem.className += ' ' + messageClass + ' ' + className;
            var parent = whatNode.parentNode
            if (whatNode.nextSibling) {
                parent.insertBefore(elem, whatNode.nextSibling)
            } else {
                parent.appendChild(elem)
            }
        }
    },
    addFieldClass: function() {
        var elem = this.elem        
        this.removeFieldClass()
        if (!this.validateFailed) {
            if (this.showMessageWhenEmpty || elem.value !== '') {
                if (elem.className.indexOf(fieldSuccClass) === -1) {
                    elem.className += ' ' + fieldSuccClass
                }
            }
        } else {
            if (elem.className.indexOf(fieldFailClass) === -1) {
                elem.className += ' ' + fieldFailClass
            }
        }
    },
    removeMessage: function() {
        var nextEl
        var el = this.afterWhatNode
        while (el.nextSibling) {
            if (el.nextSibling.nodeType === 1) {
                nextEl = el.nextSibling
                break
            }
            el = el.nextSibling
        }
        if (nextEl && nextEl.className.indexOf(messageClass) != -1) {
            this.afterWhatNode.parentNode.removeChild(nextEl)
        }
    },
    removeFieldClass: function() {
        var cls = this.elem.className
        if (cls.indexOf(fieldFailClass) !== -1) {
            this.elem.className = cls.split(fieldFailClass).join('')
        }
        if (cls.indexOf(fieldSuccClass) !== -1) {
            this.elem.className = cls.split(fieldSuccClass).join(' ')
        }
    },
    removeMessageAndFieldClass: function() {
        this.removeMessage()
        this.removeFieldClass()
    }
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

// exports Util to Validation
Validation.Util = Util
