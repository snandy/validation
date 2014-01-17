/*!
 * Validation.js v0.1.0
 * http://snandy.github.io/validation
 * Original idea: www.livevalidation.com (Copyright 2007-2010 Alec Hill)
 * @snandy 2014-01-17 17:25:51
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
 *       $('#id')
 * 
 * 2, 通过className获取
 *    $('.cls') 获取文档中所有className为cls的元素
 *    $('.cls', el)
 *    $('.cls', '#id')
 *    $('span.cls') 获取文档中所有className为cls的span元素
 *    $('span.cls', el) 获取指定元素中className为cls的元素, el为HTMLElement (不推荐)
 *    $('span.cls', '#id') 获取指定id的元素中className为cls的元素
 *    
 * 3, 通过tagName获取
 *    $('span') 获取文档中所有的span元素
 *    $('span', el) 获取指定元素中的span元素, el为HTMLElement (不推荐)
 *    $('span', '#id') 获取指定id的元素中的span元素
 * 
 * 4, 通过attribute获取
 *    $('[name]') 获取文档中具有属性name的元素
 *    $('[name]', el)
 *    $('[name]', '#id')
 *    $('[name=uname]') 获取文档中所有属性name=uname的元素
 *    $('[name=uname]', el)
 *    $('[name=uname]', '#id')
 *    $('input[name=uname]') 获取文档中所有属性name=uname的input元素
 *    $('input[name=uname]', el)
 *    $('input[name=uname]', '#id')
 */
var query = function(win, doc, undefined) {
    
// Save a reference to core methods
var slice = Array.prototype.slice

// selector regular expression
var rId = /^#[\w\-]+/
var rTag = /^([\w\*]+)$/
var rCls = /^([\w\-]+)?\.([\w\-]+)/
var rAttr = /^([\w]+)?\[([\w]+-?[\w]+?)(=(\w+))?\]/

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
    var    attribute = attr === 'className' ? 
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
    var    i = 0, r = 0
    while ( (el = all[i++]) ) {
        if ( check(attr, val, el) ) {
            result[r++] = el
        }
    }
    return result
}
    
return function(selector, context) {
    var s = selector, arr = []
    var context = context === undefined ? doc : 
        typeof context === 'string' ? query(context)[0] : context
            
    if (!selector) return arr
    
    // id和tagName 直接使用 getElementById 和 getElementsByTagName

    // id 
    if ( rId.test(s) ) {
        arr[0] = byId( s.substr(1, s.length) )
        return arr
    }
    
    // Tag name
    if ( rTag.test(s) ) {
        return makeArray(context.getElementsByTagName(s))
    }

    // 优先使用querySelector，现代浏览器都实现它了
    if (context.querySelectorAll) {
        if (context.nodeType === 1) {
            var old = context.id, id = context.id = '__ZZ__'
            try {
                return context.querySelectorAll('#' + id + ' ' + s)
            } catch(e) {
                throw new Error('querySelectorAll: ' + e)
            } finally {
                old ? context.id = old : context.removeAttribute('id')
            }
        }
        return makeArray(context.querySelectorAll(s))
    }
    
    // ClassName
    if ( rCls.test(s) ) {
        var ary = s.split('.')
        var tag = ary[0] 
        var cls = ary[1]
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

    // Attribute
    if ( rAttr.test(s) ) {
        var result = rAttr.exec(s)
        var all = context.getElementsByTagName(result[1] || '*')
        return filter(all, result[2], result[4])
    }
}

}(win, doc);

/**
 *
 * dom-class util
 * Version:  0.1
 * Author: snandy
 * Blog: http://snandy.cnblogs.com
 *
 */

var domClass = function() {
    
// IE6-10 不支持
// Safari5/Chrome8/Firefox3.6/Opera11.5 及以上版本支持
var supportClassList = function() {
    var div = document.createElement('div')
    div.className = 'a'
    return !!div.classList
}()

var hasClass, addClass, removeClass, toggleClass, replaceClass

function check(el, cls) {
    if (el.nodeType !== 1 || typeof cls !== 'string') {
        return false
    }
    return true
}

if (supportClassList) {
    hasClass = function(el, cls) {
        if ( check(el, cls) ) {
            return el.classList.contains(cls)
        } else {
            return false
        }
    }
    addClass = function(el, cls) {
        var i = 0, c;
        if ( check(el, cls) ) {
            cls = cls.split(' ')
            while ( c = cls[i++] ) {
                el.classList.add(c)
            }
        }
    }
    removeClass = function(el, cls) {
        var i = 0, c;
        if ( check(el, cls) ) {
            cls = cls.split(' ')
            while( c = cls[i++] ) {
                el.classList.remove(c)
            }
        }
    }
    toggleClass = function(el, cls) {
        if ( check(el, cls) ) {
            el.classList.toggle(cls)
        }
    }
} else {
    hasClass = function(el, cls) {
        if ( check(el, cls) ) {
            return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') != -1
        } else {
            return false
        }
    }
    addClass = function(el, cls) {
        if ( check(el, cls) && !hasClass(el, cls) ) {
            el.className += (el.className ? ' ' : '') + cls
        }
    }
    removeClass = function(el, cls) {
        if ( check(el, cls) ) {
            el.className = el.className.replace(RegExp('\\b' + cls + '\\b', 'g'), '')
        }
    }
    toggleClass = function(el, cls) {
        hasClass(el, cls) ? removeClass(el, cls) : addClass(el, cls)
    }
}

return {
    has: hasClass,
    add: addClass,
    remove: removeClass,
    toggle: toggleClass
}
    
}();

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
    if (win.jQuery) {
        return win.jQuery(selector)
    } else if (typeof query !== 'undefined') {
        return query(selector)
    }
}
function single(selector) {
    return $(selector)[0]
}
Util.$ = $

function addClass(elem, str) {
    if (win.jQuery) {
        return win.jQuery(elem).addClass(str)
    } else if (typeof domClass !== 'undefined') {
        return domClass.add(elem, str)
    }
}

function removeClass(elem, str) {
    if (win.jQuery) {
        return win.jQuery(elem).removeClass(str)
    } else if (typeof domClass !== 'undefined') {
        return domClass.remove(elem, str)
    }
}

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
        var reg = /^1(?:[38]\d|4[57]|5[012356789])\d{8}$/
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
                elemMsg.innerText = this.message
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
                elemMsg.innerText = this.message
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


// Universally Unique Identifie
var uuid = 1
// cache all instance
var formInstance = {}
    
/**
 * ValidationForm Class 私有类，仅供Validation内部使用 
 * @param {Object} elem
 */
function ValidationForm(elem) {
    this.name = elem.id
    this.elem = elem
    this.fields = []
    // preserve the old onsubmit event
    this.oldOnSubmit = this.elem.onsubmit || noop
    var self = this
    this.elem.onsubmit = function(e) {
        var ret = false
        self.valid = self.execValidate()
        if (self.valid) {
            ret = self.oldOnSubmit.call(this, e || win.event) !== false
        }
        if (!ret) return ret
    }
}

/**
 * 根据输入域（elem）的id缓存ValidationForm类的实例，即每个elem可以通过其id获取到对应的ValidationForm的实例
 */
ValidationForm.getInstance = function(elem) {
    if (!elem) return
    var el = elem.nodeName ? elem : single(elem)
    if (!el.id) {
        el.id = 'zv_form_' + uuid++
    }
    if (!formInstance[el.id]) {
        formInstance[el.id] = new ValidationForm(el)
    }

    // exprots to form element and return
    return el.valiObj = formInstance[el.id]
}
ValidationForm.prototype = {
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
    }
};
/**
 * 根据输入域的data-validate进行初始化，只需添加data-validate属性就自动完成验证，无需写一行JS代码
 * @param {DOM Element} container
 */
var oldOnload = win.onload
win.onload = function() {
    var run = single('script[data-run=true]')
    if (!run) return
    var selector = run.getAttribute('data-container')
    var container = $(selector)
    var elems = $('[data-validate]', container)
    Util.forEach(elems, function(elem) {
        var vali = new Validation(elem)
        vali.add(elem.getAttribute('data-validate'))
    })
    if (oldOnload) oldOnload.call(win)
}



// Expose Validation to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
	define('Validation', [], function() { return Validation } )
} else {
	win.Validation = Validation
}

}(this, document);
