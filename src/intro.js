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