
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