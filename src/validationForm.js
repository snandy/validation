
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