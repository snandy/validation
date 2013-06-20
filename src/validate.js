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