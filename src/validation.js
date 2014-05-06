/**
 *  Validation Class 公开类
 * 
 * @param {Object} elem [id or css selector(jQuery support)]
 * @param {Object} option
 * 
 *   option properties: 
 *      succMsg {String}            正确的提示消息 ,如果没传，将从输入域的data-vali-succmsg取  (默认 "填写正确")
 *      afterWhatNode {Element}     提示信息插入的位置，如果该元素存在在插入它后面 (默认插在输入域的后面)
 *      msg {String}                提示信息元素的选择器，此时优先使用该dom元素，不自行创建 （[data-zvmsg=xx]）
 *      onlyOnBlur {Bool}           是否仅在光标离验证 (默认false)
 *      onlyOnSubmit {Bool}         是否仅在Form提交时验证
 *      fieldSuccClass {String}     输入域 正确时class (可选)
 *      fieldFailClass {String}     输入域 错误时class (可选)
 *      
 *      beforeValidate {Function}   验证前的回调函数 (可选)

 *      beforeSucc {Function}       验证正确时执行，在onValid前 (可选)
 *      onSucc {Function}           验证正确函数，此函数将覆盖默认处理函数，你必须实现将正确提示消息展现到UI (可选)
 *      afterSucc {Function}        验证正确时执行，在onValid后 (可选)
 * 
 *      beforeError {Function}      验证失败时执行，在onInValid前 (可选)
 *      onError {Function}          验证失败函数，此函数将覆盖默认处理函数，你必须实现将失败提示消息展现到UI (可选)
 *      afterError {Function}       验证失败时执行，在onValid后 (可选)

 *      afterValidate {Function}    验证前的回调函数 (可选)
 * 
 */
function Validation(elem, option) {
    if (!elem) return
    this.elem = elem.nodeName ? elem : single(elem)
    if (!this.elem) throw new Error('element is not exits')
    this.initialize(option)
}

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

Validation.prototype = {
    initialize: function(option) {
        var elem = this.elem
        option = option || {}

        this.rules = []
        this.elemType = getType(elem)
        this.form = elem.form
        this.fieldSuccClass  = option.fieldSuccClass  || 'zv_succ_field'
        this.fieldFailClass  = option.fieldFailClass  || 'zv_fail_field'
        this.msgValidClass   = option.msgValidClass   || 'zv_valid_msg'
        this.msgInvalidClass = option.msgInvalidClass || 'zv_invalid_msg'

        // 提示语插入在哪个元素后面，可以是dom元素或css选择器
        var whatNode = option.afterWhatNode || elem
        this.afterWhatNode = whatNode.nodeType ? whatNode : single(whatNode)

        option.msg = option.msg || elem.getAttribute('name')
        this.elemMsg = single('[data-zvmsg=' + option.msg + ']', this.form)

        // 两种情形，页面上有提示语则不创建
        if (!this.elemMsg) {
            this.elemMsg = doc.createElement('span')
            var parent = whatNode.parentNode
            if (whatNode.nextSibling) {
                parent.insertBefore(this.elemMsg, whatNode.nextSibling)
            } else {
                parent.appendChild(this.elemMsg)
            }
        }

        var self = this
        var elemMsg = this.elemMsg
        // options
        var option = option || {}

        // 验证正确的提示语
        this.succMsg = option.succMsg || elem.getAttribute('data-succ-msg') || '填写正确'


        // 是否仅在鼠标离开时验证，默认否
        this.onlyOnBlur = option.onlyOnBlur || false
        
        // 是否仅在form提交的时候验证，默认否
        this.onlyOnSubmit = option.onlyOnSubmit || false
        
        // events 验证前、验证后、验证中

        // 验证前
        this.beforeValidate = option.beforeValidate || noop

        // 验证通过
        this.beforeSucc = option.beforeSucc || noop
        this.onSucc = option.onSucc || function() {
            if (elem.value !== '' || this.showMessageWhenEmpty) {
                elemMsg.innerHTML = this.message
                elemMsg.className = this.msgValidClass
                elemMsg.style.display = ''

                // 输入域正确时的样式
                addClass(this.elem, this.fieldSuccClass)
            }
        }
        this.afterSucc = option.afterSucc || noop

        // 验证不通过
        this.beforeError = option.beforeError || noop
        this.onError = option.onError || function() {
            if (elem.value !== '' || this.showMessageWhenEmpty) {
                elemMsg.innerHTML = this.message
                elemMsg.className = this.msgInvalidClass
                elemMsg.style.display = ''

                // 输入域错误时的样式
                addClass(this.elem, this.fieldFailClass)
            }
        }
        this.afterError  = option.afterError || noop

        // 验证后
        this.afterValidate = option.afterValidate || noop
        
        // add to form if it has been provided
        if (this.form) {
            this.formObj = ValidationForm.getInstance(this.form)
            this.formObj.addField(this)
        }

        // 暂存旧事件hander
        this.oldOnfocus  = elem.onfocus  || noop
        this.oldOnBlur   = elem.onblur   || noop
        this.oldOnClick  = elem.onclick  || noop
        this.oldOnChange = elem.onchange || noop
        this.oldOnKeyup  = elem.onkeyup  || noop
        
        elem.onfocus = function(e) {
            self.reset()
            self.oldOnfocus.call(this, e)
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
                        self.validate(e)
                        return self.oldOnKeyup.call(this, e)
                    }
                }
                elem.onblur = function(e) {
                    self.validate(e)
                    return self.oldOnBlur.call(this, e)
                }
        }
    },
    add: function(op, option) {
        var self = this
        option = option || {}
        if (!option.failureMsg) {
            option.failureMsg = self.elem.getAttribute('data-error-msg')
        }
        if ( Util.isString(op) ) {
            forEach(op.split(' '), function(n, i) {
                self.rules.push({
                    validateFunc: Validate[n],
                    params: option
                })
            })
        }
    },
    remove: function(func, option) {
        var rules = this.rules
        var victimless = []
        forEach(rules, function(obj) {
            if (obj.type != func && obj.params != option) {
                victimless.push(obj)
            }
        })
        this.rules = victimless
    },
    doValidation: function() {
        var rules = this.rules
        var length = rules.length
        this.validateFailed = false
        for (var i = 0; i < length; ++i) {
            var vs = rules[i]
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
                    isValid = false
                    this.message = error.message
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
            this.beforeError()
            this.onError()
            this.afterError()
        }
        this.afterValidate()
        return isValid
    },
    reset: function() {
        this.elemMsg.style.display = 'none'
        removeClass(this.elem, this.fieldSuccClass)
        removeClass(this.elem, this.fieldFailClass)
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

// exports Util to Validation
Validation.Util = Util
